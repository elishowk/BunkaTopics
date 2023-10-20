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
                str(int(doc["topic_id"].split("-")[1])): {
                    "rank": doc["topic_ranking"]["rank"]
                }
            } if doc["topic_ranking"] else {}
        },
        "dimensions": doc["embedding"]
    } for doc in source_data["documents"]]

    # Traduire chaque topic en utilisant une list comprehension
    dest_data_topics = [{
        "id": int(topic["topic_id"].split("-")[1]),
        "size": topic["size"],
        "percent": None,  # Pas présent dans les données source
        "parent_topic_id": None,  # Pas présent dans les données source
        "centroid": {
            "cluster_id": int(topic["topic_id"].split("-")[1]),
            "x": topic["x_centroid"],
            "y": topic["y_centroid"]
        },
        "convex_hull": {
            "cluster_id": int(topic["topic_id"].split("-")[1]),
            "x_coordinates": topic["convex_hull"]["x_coordinates"],
            "y_coordinates": topic["convex_hull"]["y_coordinates"]
        },
        "explanation": {
            "topic_id": int(topic["topic_id"].split("-")[1]),
            "name": topic["name"],
            "specific_terms": topic["term_id"],
            "top_terms": [],
            "top_entities": []
        }
    } for topic in source_data["topics"]]

    with open(output_file_path, 'w') as outfile:
        # Écrire l'objet JSON 
        json.dump({
            "documents": dest_data_documents,
            "topics": dest_data_topics
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
    print(output_file_path)


    transform_and_write(source_data, output_file_path)
    # Change to the app directory
    subprocess.Popen(['make', 'startweb'], cwd=root_path)

    # Give the server some time to start up before opening the browser.
    time.sleep(15)

    # Open the browser
    webbrowser.open("http://localhost:3000/fr/search?q=")