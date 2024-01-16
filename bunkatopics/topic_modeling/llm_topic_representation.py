import typing as t

import pandas as pd
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from tqdm import tqdm

from bunkatopics.datamodel import Document, Topic
from bunkatopics.topic_modeling.prompt_generator import (
    promp_template_topics_terms,
    promp_template_topics_terms_no_docs,
)

TERM_ID = str


def get_clean_topic_all(
    llm,
    topics: t.List[Topic],
    docs: t.List[Document],
    language: str = "english",
    top_doc: int = 3,
    top_terms: int = 10,
    use_doc: bool = False,
    context: str = "everything",
) -> t.List[Topic]:
    """
    Get cleaned topic labels for a list of topics using a generative model.

    Args:
        llm: The generative model to use.
        topics: List of topics to clean.
        docs: List of documents related to the topics.
        language: Language for generating clean labels.
        top_doc: Number of top documents to consider.
        top_terms: Number of top terms to consider.
        use_doc: Whether to use documents in label generation.
        context: Context for label generation.

    Returns:
        List of topics with cleaned labels.
    """
    df = _get_df_prompt(topics, docs)

    topic_ids = list(df["topic_id"])
    specific_terms = list(df["keywords"])
    top_doc_contents = list(df["content"])

    final_dict = {}
    pbar = tqdm(total=len(topic_ids), desc="Creating new labels for clusters")
    for topic_ic, x, y in zip(topic_ids, specific_terms, top_doc_contents):
        clean_topic_name = _get_clean_topic(
            llm=llm,
            language=language,
            specific_terms=x,
            specific_documents=y,
            use_doc=use_doc,
            top_terms=top_terms,
            top_doc=top_doc,
            context=context,
        )
        final_dict[topic_ic] = clean_topic_name
        pbar.update(1)

    for topic in topics:
        topic.name = final_dict.get(topic.topic_id)

    return topics


def _get_clean_topic(
    llm,
    specific_terms: t.List[str],
    specific_documents: t.List[str],
    language: str = "english",
    top_doc: int = 3,
    top_terms: int = 10,
    use_doc: bool = False,
    context: str = "different things",
) -> str:
    """
    Get a cleaned topic label using a generative model.

    Args:
        generative_model: The generative model to use.
        specific_terms: List of specific terms related to the topic.
        specific_documents: List of specific documents related to the topic.
        language: Language for generating clean labels.
        top_doc: Number of top documents to consider.
        top_terms: Number of top terms to consider.
        use_doc: Whether to use documents in label generation.
        context: Context for label generation.

    Returns:
        Cleaned topic label.
    """
    specific_terms = specific_terms[:top_terms]
    specific_documents = specific_documents[:top_doc]

    if use_doc:
        PROMPT_TOPICS = ChatPromptTemplate.from_template(promp_template_topics_terms)

        topic_chain = LLMChain(llm=llm, prompt=PROMPT_TOPICS)
        clean_topic_name = topic_chain(
            {
                "terms": ", ".join(specific_terms),
                "documents": " \n".join(specific_documents),
                "context": context,
                "language": language,
            }
        )
    else:
        PROMPT_TOPICS_NO_DOCS = ChatPromptTemplate.from_template(
            promp_template_topics_terms_no_docs
        )

        topic_chain = LLMChain(llm=llm, prompt=PROMPT_TOPICS_NO_DOCS)
        clean_topic_name = topic_chain(
            {
                "terms": ", ".join(specific_terms),
                "context": context,
                "language": language,
            }
        )

    clean_topic_name = clean_topic_name["text"]
    clean_topic_name = _clean_final_output(clean_topic_name)

    return clean_topic_name


def _clean_final_output(x):
    res = x.strip().strip('"')
    res = res.strip()

    if res.endswith("."):
        res = res[:-1]
    return res


def _get_df_prompt(topics: t.List[Topic], docs: t.List[Document]) -> pd.DataFrame:
    """
    Get a dataframe for input to the prompt.

    Args:
        topics: List of topics.
        docs: List of documents.

    Returns:
        DataFrame for prompt input.
    """
    docs_with_ranks = [x for x in docs if x.topic_ranking is not None]

    df_for_prompt = pd.DataFrame(
        {
            "topic_id": [x.topic_ranking.topic_id for x in docs_with_ranks],
            "rank": [x.topic_ranking.rank for x in docs_with_ranks],
            "doc_id": [x.doc_id for x in docs_with_ranks],
        }
    )

    df_for_prompt = df_for_prompt.sort_values(
        ["topic_id", "rank"], ascending=(False, True)
    )
    df_for_prompt = df_for_prompt[["topic_id", "doc_id"]]

    df_doc = pd.DataFrame(
        {
            "doc_id": [x.doc_id for x in docs],
            "content": [x.content for x in docs],
        }
    )

    df_for_prompt = pd.merge(df_for_prompt, df_doc, on="doc_id")
    df_for_prompt = df_for_prompt.groupby("topic_id")["content"].apply(
        lambda x: list(x)
    )

    df_keywords = pd.DataFrame(
        {
            "topic_id": [x.topic_id for x in topics],
            "keywords": [x.name.split(" | ") for x in topics],
        }
    )

    df_for_prompt = pd.merge(df_keywords, df_for_prompt, on="topic_id")

    return df_for_prompt
