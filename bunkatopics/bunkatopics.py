import json
import os
import random
import string
import subprocess
import typing as t
import uuid
import warnings

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import umap
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from numba.core.errors import NumbaDeprecationWarning
from sklearn.preprocessing import MinMaxScaler
from tqdm import tqdm

from bunkatopics.bunka_logger import logger
from bunkatopics.datamodel import (DOC_ID, BourdieuQuery, Document, Topic,
                                   TopicGenParam, TopicParam)
from bunkatopics.functions.bourdieu_api import bourdieu_api
from bunkatopics.functions.coherence import get_coherence
from bunkatopics.functions.extract_terms import TextacyTermsExtractor
from bunkatopics.functions.topic_document import get_top_documents
from bunkatopics.functions.topic_gen_representation import get_clean_topic_all
from bunkatopics.functions.topic_utils import get_topic_repartition
from bunkatopics.functions.topics_modeling import get_topics
from bunkatopics.serveur.utils import is_server_running, kill_server
from bunkatopics.visualisation.bourdieu_visu import \
    visualize_bourdieu_one_dimension
from bunkatopics.visualisation.new_bourdieu_visu import visualize_bourdieu
from bunkatopics.visualisation.query_visualisation import plot_query
from bunkatopics.visualisation.topic_visualization import visualize_topics

warnings.filterwarnings("ignore", category=NumbaDeprecationWarning)

os.environ["TOKENIZERS_PARALLELISM"] = "true"


class Bunka:
    def __init__(self, embedding_model=None, language: str = "english"):
        if embedding_model is None:
            embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.embedding_model = embedding_model
        self.language = language

    def fit(
        self,
        docs: t.List[str],
        ids: t.List[DOC_ID] = None,
    ) -> None:
        """
        Fit the BunkaTopics model to a list of documents and optionally associated document IDs.

        Args:
            docs (List[str]): List of document contents.
            ids (List[DOC_ID], optional): List of document IDs. If not provided, random IDs are generated.
                                          Defaults to None.

        Returns:
            None
        """
        df = pd.DataFrame(docs, columns=["content"])

        # Transform into a Document model
        if ids is not None:
            df["doc_id"] = ids
        else:
            df["doc_id"] = [str(uuid.uuid4())[:8] for _ in range(len(df))]
        df = df[~df["content"].isna()]
        df = df.reset_index(drop=True)
        self.docs = [Document(**row) for row in df.to_dict(orient="records")]
        sentences = [doc.content for doc in self.docs]
        ids = [doc.doc_id for doc in self.docs]

        logger.info("Extracting terms from documents")
        terms_extractor = TextacyTermsExtractor(language=self.language)
        self.terms, indexed_terms_dict = terms_extractor.fit_transform(ids, sentences)

        # add to the docs object
        for doc in self.docs:
            doc.term_id = indexed_terms_dict.get(doc.doc_id, [])

        logger.info("Embedding Documents, this may time depending on the size")

        characters = string.ascii_letters + string.digits
        random_string = "".join(random.choice(characters) for _ in range(20))

        # using Chroma as a vectorstore
        self.vectorstore = Chroma(
            embedding_function=self.embedding_model, collection_name=random_string
        )

        self.vectorstore.add_texts(texts=sentences, ids=ids)
        embeddings = self.vectorstore._collection.get(include=["embeddings"])[
            "embeddings"
        ]

        df_embeddings = pd.DataFrame(embeddings)
        df_embeddings.index = ids

        emb_doc_dict = {x: y for x, y in zip(ids, embeddings)}

        for doc in self.docs:
            doc.embedding = emb_doc_dict.get(doc.doc_id, [])

        logger.info("Reducing Dimensions")

        reducer = umap.UMAP(
            n_components=2,
            random_state=None,
        )  # Not random state to go quicker
        embeddings_2D = reducer.fit_transform(embeddings)
        df_embeddings_2D = pd.DataFrame(embeddings_2D)
        df_embeddings_2D.columns = ["x", "y"]
        df_embeddings_2D["doc_id"] = ids

        xy_dict = df_embeddings_2D.set_index("doc_id")[["x", "y"]].to_dict("index")

        # Update the documents with the x and y values from the DataFrame
        for doc in self.docs:
            doc.x = xy_dict[doc.doc_id]["x"]
            doc.y = xy_dict[doc.doc_id]["y"]

    def fit_transform(self, docs: t.List[Document], n_clusters=3) -> pd.DataFrame:
        """
        Fit and transform the BunkaTopics model with a list of Document objects into a DataFrame of topics.

        Args:
            docs (List[Document]): List of Document objects representing the documents to be clustered.
            n_clusters (int, optional): Number of clusters/topics to be generated. Defaults to 40.

        Returns:
            pd.DataFrame: A DataFrame containing information about the generated topics.
        """
        self.fit(docs)
        df_topics = self.get_topics(n_clusters=n_clusters)
        return df_topics

    def get_topics(
        self,
        n_clusters: int = 5,
        ngrams: t.List[int] = [1, 2],
        name_length: int = 10,
        top_terms_overall: int = 2000,
        min_count_terms: int = 2,
    ) -> pd.DataFrame:
        """
        Get topics based on the provided parameters.

        Args:
            n_clusters (int): Number of clusters for topic extraction.
            ngrams (list): List of n-gram sizes to consider.
            name_length (int): Maximum length of topic names.
            top_terms_overall (int): Number of top terms to consider.
            min_count_terms (int): Minimum count of terms to include.

        Returns:
            pd.DataFrame: DataFrame containing the extracted topics.
        """

        logger.info("Computing the topics")
        self.topics: t.List[Topic] = get_topics(
            docs=self.docs,
            terms=self.terms,
            n_clusters=n_clusters,
            ngrams=ngrams,
            name_length=name_length,
            x_column="x",
            y_column="y",
            top_terms_overall=top_terms_overall,
            min_count_terms=min_count_terms,
        )

        self.docs, self.topics = get_top_documents(
            self.docs, self.topics, ranking_terms=20
        )
        df_topics = pd.DataFrame.from_records([topic.dict() for topic in self.topics])
        return df_topics

    def rag_query(self, query: str, generative_model, top_doc: int = 2):
        logger.info("Answering your query, please wait a few seconds")

        # this is the entire retrieval system
        qa_with_sources_chain = RetrievalQA.from_chain_type(
            llm=generative_model,
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": top_doc}),
            # chain_type_kwargs=chain_type_kwargs,
            return_source_documents=True,
        )

        response = qa_with_sources_chain({"query": query})

        return response

    def get_clean_topic_name(
        self, generative_model, language="english", use_doc=False, context="everything"
    ) -> pd.DataFrame:
        """

        Get the topic name using Generative AI

        """
        self.topics: t.List[Topic] = get_clean_topic_all(
            generative_model,
            self.topics,
            self.docs,
            language=language,
            use_doc=use_doc,
            context=context,
        )
        df_topics = pd.DataFrame.from_records([topic.dict() for topic in self.topics])

        return df_topics

    def visualize_topics(
        self,
        show_text: bool = True,
        label_size_ratio: int = 100,
        width: int = 1000,
        height: int = 1000,
    ) -> go.Figure:
        """
        Visualize topics and documents in a 2D scatter plot with contour density representation.

        Args:
            show_text (bool, optional): Flag to display text labels on the plot. Defaults to False.
            label_size_ratio (int, optional): Size ratio for label text. Defaults to 100.
            width (int, optional): Width of the plot. Defaults to 1000.
            height (int, optional): Height of the plot. Defaults to 1000.

        Returns:
            go.Figure: Plotly figure object representing the visualization.
        """

        logger.info("Creating the Bunka Map")
        fig = visualize_topics(
            self.docs,
            self.topics,
            width=width,
            height=height,
            show_text=show_text,
            label_size_ratio=label_size_ratio,
        )
        return fig

    def search(self, user_input: str, top_doc: int = 3) -> pd.DataFrame:
        res = self.vectorstore.similarity_search_with_score(user_input, k=top_doc)
        # res = vector_search(self.docs, self.embedding_model, user_input=user_input)
        return res

    def get_topic_coherence(self, topic_terms_n=10):
        texts = [doc.term_id for doc in self.docs]
        res = get_coherence(self.topics, texts, topic_terms_n=topic_terms_n)
        return res

    def get_topic_repartition(self, width=1200, height=800) -> go.Figure:
        fig = get_topic_repartition(self.topics, width=width, height=height)
        return fig

    def visualize_bourdieu(
        self,
        generative_model=None,
        x_left_words=["war"],
        x_right_words=["peace"],
        y_top_words=["men"],
        y_bottom_words=["women"],
        height=1500,
        width=1500,
        display_percent=True,
        clustering=False,
        topic_n_clusters=10,
        topic_terms=2,
        topic_ngrams=[1, 2],
        topic_top_terms_overall=500,
        gen_topic_language="english",
        topic_gen_name=False,
        manual_axis_name=None,
        use_doc_gen_topic=False,
        radius_size: float = 0.3,
        convex_hull=True,
    ) -> go.Figure:
        topic_gen_param = TopicGenParam(
            language=gen_topic_language,
            top_doc=3,
            top_terms=10,
            use_doc=use_doc_gen_topic,
            context="everything",
        )

        topic_param = TopicParam(
            n_clusters=topic_n_clusters,
            ngrams=topic_ngrams,
            name_lenght=topic_terms,
            top_terms_overall=topic_top_terms_overall,
        )

        self.bourdieu_query = BourdieuQuery(
            x_left_words=x_left_words,
            x_right_words=x_right_words,
            y_top_words=y_top_words,
            y_bottom_words=y_bottom_words,
            radius_size=radius_size,
        )

        # Request Bourdieu API
        res = bourdieu_api(
            generative_model=generative_model,
            embedding_model=self.embedding_model,
            docs=self.docs,
            terms=self.terms,
            bourdieu_query=self.bourdieu_query,
            generative_ai_name=topic_gen_name,
            topic_param=topic_param,
            topic_gen_param=topic_gen_param,
        )

        self.bourdieu_docs = res[0]
        self.bourdieu_topics = res[1]

        # Visualize The results from the API
        fig = visualize_bourdieu(
            self.bourdieu_docs,
            self.bourdieu_topics,
            height=height,
            width=width,
            display_percent=display_percent,
            convex_hull=convex_hull,
            clustering=clustering,
            manual_axis_name=manual_axis_name,
        )

        return fig

    def start_server_bourdieu(self):
        if is_server_running():
            print("Server on port 3000 is already running. Killing it...")
            kill_server()
        try:
            file_path = "../web/public" + "/bunka_bourdieu_docs.json"
            docs_json = [x.dict() for x in self.bourdieu_docs]

            with open(file_path, "w") as json_file:
                json.dump(docs_json, json_file)

            file_path = "../web/public" + "/bunka_bourdieu_topics.json"
            topics_json = [x.dict() for x in self.bourdieu_topics]
            with open(file_path, "w") as json_file:
                json.dump(topics_json, json_file)

            file_path = "../web/public" + "/bunka_bourdieu_query.json"
            with open(file_path, "w") as json_file:
                json.dump(self.bourdieu_query.dict(), json_file)

            subprocess.Popen(["npm", "start"], cwd="../web")
            print(
                "NPM server started. Please Switch to Bourdieu View to see the results"
            )
        except Exception as e:
            print(f"Error starting NPM server: {e}")

    def start_server(self):
        if is_server_running():
            print("Server on port 3000 is already running. Killing it...")
            kill_server()
        try:
            file_path = "../web/public" + "/bunka_docs.json"
            docs_json = [x.dict() for x in self.docs]

            with open(file_path, "w") as json_file:
                json.dump(docs_json, json_file)

            file_path = "../web/public" + "/bunka_topics.json"
            topics_json = [x.dict() for x in self.topics]
            with open(file_path, "w") as json_file:
                json.dump(topics_json, json_file)

            subprocess.Popen(["npm", "start"], cwd="../web")
            print("NPM server started.")
        except Exception as e:
            print(f"Error starting NPM server: {e}")

    def visu_query(
        self, query="What is firearm?", min_score=0.8, width=600, height=300
    ):
        fig, percent = plot_query(
            embedding_model=self.embedding_model,
            docs=self.docs,
            query=query,
            min_score=min_score,
            width=width,
            height=height,
        )
        return fig, percent

    def visualize_bourdieu_one_dimension(
        self,
        left=["negative", "bad"],
        right=["positive"],
        width=1200,
        height=1200,
        explainer=False,
    ):
        fig = visualize_bourdieu_one_dimension(
            docs=self.docs,
            embedding_model=self.embedding_model,
            left=left,
            right=right,
            width=width,
            height=height,
            explainer=explainer,
        )

        return fig

    def get_dimensions(
        self, dimensions: t.List[str], width=500, height=500, template="plotly_dark"
    ) -> go.Figure:
        final_df = []
        logger.info("Computing Similarities")
        scaler = MinMaxScaler(feature_range=(0, 1))
        for dim in tqdm(dimensions):
            df_search = self.search(dim)
            df_search["score"] = scaler.fit_transform(
                df_search[["cosine_similarity_score"]]
            )
            df_search["source"] = dim
            final_df.append(df_search)
        final_df = pd.concat([x for x in final_df])

        final_df_mean = (
            final_df.groupby("source")["score"]
            .mean()
            .rename("mean_score")
            .reset_index()
        )
        final_df_mean = final_df_mean.sort_values(
            "mean_score", ascending=True
        ).reset_index(drop=True)
        final_df_mean["rank"] = final_df_mean.index + 1

        self.df_dimensions = final_df_mean

        fig = px.line_polar(
            final_df_mean,
            r="mean_score",
            theta="source",
            line_close=True,
            template=template,
            width=width,
            height=height,
        )
        return fig
