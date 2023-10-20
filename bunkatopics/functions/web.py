import os
import subprocess
import webbrowser
import time
import json
from pathlib import Path

def transform_and_write(source_data, output_file_path):
    """
    Transform BunkaTopics output to the web front-end format
    """
    left_words = []
    right_words = []

    for doc in source_data["documents"]:
        if doc["bourdieu_dimensions"]:
            for dimension in doc["bourdieu_dimensions"]:
                left_words += [dimension["continuum"]["left_words"]]
                right_words += [dimension["continuum"]["right_words"]]
    # Traduire chaque document en utilisant une list comprehension
    dest_data_documents = [{
        "id": doc["doc_id"],
        "text": doc["content"],
        "source": None,  # Pas présent dans les données source
        "language": "en",  # Pas présent dans les données source
        "languages": ["en"],  # Pas présent dans les données source
        "created_at_timestamp_sec": None,  # Pas présent dans les données source
        "author": None,  # Pas présent dans les données source
        "embedding_light": [doc["x"], doc["y"]],
        "topic_ids": doc["term_id"],
        "rank": {
            "rank": doc["topic_ranking"]["rank"] if doc["topic_ranking"] else None,
            "rank_per_topic": {
                str(doc["topic_id"]): {
                    "rank": doc["topic_ranking"]["rank"],
                    "score": None,
                    "score_bin": None,
                    "count_specific_terms": None,
                    "specificity_bin": None,
                    "bunka_score": None
                }
            } if doc["topic_ranking"] else {}
        },
        # doc["embedding"] n'est pas présent dans les données cibles
        "dimensions": [{
            "id": " / ".join([" ".join(dimension["continuum"]["left_words"]), " ".join(dimension["continuum"]["right_words"])]),
            "score": dimension["distance"]
        } for dimension in doc["bourdieu_dimensions"] if doc["bourdieu_dimensions"]],
    } for doc in source_data["documents"]]

    # Traduire chaque topic en utilisant une list comprehension
    dest_data_topics = [{
        "id": topic["topic_id"],
        "size": topic["size"],
        "percent": None,  # Pas présent dans les données source
        "parent_topic_id": None,  # Pas présent dans les données source
        "centroid": {
            "cluster_id": topic["topic_id"],
            "x": topic["x_centroid"],
            "y": topic["y_centroid"]
        },
        "convex_hull": {
            "cluster_id": topic["topic_id"],
            "x_coordinates": topic["convex_hull"]["x_coordinates"],
            "y_coordinates": topic["convex_hull"]["y_coordinates"]
        },
        "explanation": {
            "topic_id": topic["topic_id"],
            "name": topic["name"],
            "specific_terms": topic["term_id"],
            "top_terms": topic["top_term_id"],
            "top_entities": topic["top_doc_id"]
        }
    } for topic in source_data["topics"]]

    with open(output_file_path, 'w') as outfile:
        # Écrire l'objet JSON 
        json.dump({
            "documents": dest_data_documents,
            "topics": dest_data_topics,
            "query": {
                "text": "Test",
                "top_k": 400,
                "min_doc_retrieved": 100,
                "max_toxicity": 0.8,
                "languages": None,
                "topics": {
                    "shape": [
                        6,
                        2
                    ],
                    "convex_hull_interpolation": True,
                    "min_doc_per_topic": 20,
                    "ngrams": [
                        1,
                        2
                    ],
                    "min_count_term": 3,
                    "top_terms_included": 20000,
                    "text_type": "term_id",
                    "n_terms_in_name": 5,
                    "number_top_terms_returned": 20,
                    "number_specific_terms_returned": 20,
                    "top_n_specificity_fn": 200,
                    "specificity_weight": 6,
                    "popularity_weight": 3,
                    "feature_binned_number": 10
                },
                "intensity_dimensions": [
                    {
                        "id": "arts",
                        "kind": "intensity",
                        "words": [
                            "arts",
                            "sculpture",
                            "architecture",
                            "painting",
                            "drawing",
                            "music",
                            "literature",
                            "poetry",
                            "theater",
                            "dance",
                            "movie",
                            "photography",
                            "cinema",
                            "cooking",
                            "fashion"
                        ]
                    },
                ],
                "continuum_dimensions": [
                    {
                        "id": "positive / negative",
                        "kind": "continuum",
                        "left_id": "positive",
                        "right_id": "negative",
                        "left_words": left_words,
                        "right_words": right_words
                    },
                ]
            },
            "nb_documents": len(source_data["documents"]),
        }, outfile, indent=4)

def launch_web_app(source_data):
    """
    Main function
    """
    package_root_path = os.environ.get('BUNKATOPICS_ABSOLUTE_PATH')
    # Get the path of the current module (your Python script)
    current_module_path = Path(__file__).resolve()
    # Define the root path of your package by going up two levels
    root_path = Path(package_root_path) if package_root_path else current_module_path.parent.parent.parent
    output_file_path = root_path / 'web' / 'public' / 'localSearchResults.json'
    transform_and_write(source_data, output_file_path)
    # Change to the app directory
    subprocess.Popen(['make', 'startweb'], cwd=root_path)

    # Give the server some time to start up before opening the browser.
    time.sleep(15)

    # Open the browser
    webbrowser.open("http://localhost:3000/fr/search?q=")