import pandas as pd

# from .indexer import indexer
from sklearn.feature_extraction.text import TfidfVectorizer
from multiprocess_embeddings import get_embeddings
from extract_terms import extract_terms_df


class BasicSemantics:
    """This Class carries out the basic operations that all following models will use
    - terms extraction
    - terms indexation
    - docs embeddings
    - terms embeddings

    This class will be used as Parent of other specialized class

    """

    def __init__(
        self,
        data,
        text_var,
        index_var,
        terms_path=None,
        terms_embeddings_path=None,
        docs_embeddings_path=None,
    ):
        self.data = data[data[text_var].notna()].reset_index(drop=True)
        self.text_var = text_var
        self.index_var = index_var

        self.terms_path = terms_path
        self.terms_embeddings_path = terms_embeddings_path
        self.docs_embeddings_path = docs_embeddings_path

        # Load existing dataset if they exist
        """if terms_path is not None:
            self.terms = pd.read_csv(terms_path, index_col=[0])
            self.index_terms(projection=False, db_path=".")"""

        if terms_embeddings_path is not None:
            self.terms_embeddings = pd.read_csv(terms_embeddings_path, index_col=[0])

        if docs_embeddings_path is not None:
            self.docs_embeddings = pd.read_csv(docs_embeddings_path, index_col=[0])

    def fit(
        self,
        extract_terms=True,
        terms_embeddings=True,
        docs_embeddings=False,
        sample_size_terms=500,
        terms_limit=500,
        terms_ents=True,
        terms_ngrams=(1, 2),
        terms_ncs=True,
        terms_include_pos=["NOUN", "PROPN", "ADJ"],
        terms_include_types=["PERSON", "ORG"],
        embeddings_model="distiluse-base-multilingual-cased-v1",
        multiprocessing=True,
        reduction=5,
        language="fr",
    ):

        if self.terms_embeddings_path is not None:
            terms_embedding = False
        if self.docs_embeddings_path is not None:
            docs_embeddings = False
        if self.terms_path is not None:
            extract_terms = False

        if extract_terms:
            self.terms = self.extract_terms(
                sample_size=sample_size_terms,
                limit=terms_limit,
                ents=terms_ents,
                ncs=terms_ncs,
                ngrams=terms_ngrams,
                include_pos=terms_include_pos,
                include_types=terms_include_types,
                language=language,
                multiprocessing=multiprocessing,
            )

        if docs_embeddings:
            self.docs_embeddings = self.extract_docs_embeddings(
                multiprocessing=multiprocessing, reduction=reduction
            )
        if terms_embeddings:
            self.terms_embeddings = self.extract_terms_embeddings(
                multiprocessing=multiprocessing, reduction=reduction
            )

        self.docs_embedding_model = embeddings_model

    def extract_terms(
        self,
        sample_size,
        limit,
        ents=True,
        ncs=True,
        ngrams=(1, 2),
        include_pos=["NOUN", "PROPN", "ADJ"],
        include_types=["PERSON", "ORG"],
        language="en",
        multiprocessing=True,
    ):
        terms, terms_indexed = extract_terms_df(
            self.data,
            text_var=self.text_var,
            index_var=self.index_var,
            ngs=True,
            ents=ents,
            ncs=ncs,
            multiprocess=multiprocessing,
            sample_size=sample_size,
            drop_emoji=True,
            ngrams=ngrams,
            remove_punctuation=False,
            include_pos=include_pos,
            include_types=include_types,
            language=language,
        )

        terms = terms.sort_values("count_terms", ascending=False)
        self.terms = terms.head(limit)

        self.terms_indexed = terms_indexed

        return terms

    def extract_docs_embeddings(self, multiprocessing=True, reduction=5):
        # Extract Embeddings
        self.df_docs_embeddings = get_embeddings(
            self.data,
            index_var=self.index_var,
            text_var=self.text_var,
            multiprocessing=multiprocessing,
            reduction=reduction,
        )

        return self.df_docs_embeddings

    def extract_terms_embeddings(self, multiprocessing=True, reduction=5):
        # Extract Embeddings
        self.df_terms_embeddings = get_embeddings(
            self.terms.reset_index(),
            index_var="index",
            text_var="text",
            multiprocessing=multiprocessing,
            reduction=reduction,
        )

        return self.df_terms_embeddings


if __name__ == "__main__":
    path = "/Users/charlesdedampierre/Desktop/ENS Projects/humility"
    df_index = pd.read_csv(path + "/extended_dataset/extended_training_dataset.csv")
    df_index = df_index[["body", "label"]].drop_duplicates()
    df_index = df_index.sample(100)
    df_index["index"] = df_index.index

    model = BasicSemantics(df_index, index_var="index", text_var="body")
    model.fit()
