import subprocess
import webbrowser
import time
from pathlib import Path

def transform_and_write(source_data, output_file_path):
    """
    Memory optimized function to transform BunkaTopics output to the web front-end format
    """
    with open(output_file_path, 'w') as f:
        # Écrire l'objet JSON de niveau supérieur et la clé "documents"
        f.write('{"documents": [')

        # Traiter et écrire chaque document un par un
        for i, doc in enumerate(source_data["documents"]):
            # TODO this is draft, fix translations
            transformed_doc = {
                "doc_id": doc["id"], 
                "content": doc["text"],
                "size": None,
                "x": doc["embedding_light"][0],
                "y": doc["embedding_light"][1],
                "topic_id": f"bt-{doc['topic_ids'][0]}",
                "topic_ranking": {
                    "topic_id": f"bt-{doc['rank']['rank_per_topic'][str(doc['topic_ids'][0])]['rank']}",
                    "rank": doc["rank"]["rank"]
                },
                "term_id": [],
                "embedding": [],
                "bourdieu_dimensions": [dim["score"] for dim in doc["dimensions"]]
            }
            f.write(json.dumps(transformed_doc))
            if i != len(source_data["documents"]) - 1:
                f.write(',')

        # Écrire la délimitation entre "documents" et "topics"
        f.write('], "topics": [')

        # Traiter et écrire chaque topic un par un
        for i, topic in enumerate(source_data["topics"]):
            # TODO this is draft, fix translations
            transformed_topic = {
                "topic_id": f"bt-{topic['id']}",
                "name": topic["explanation"]["name"],
                "lemma_name": None,
                "term_id": topic["explanation"]["specific_terms"],
                "x_centroid": topic["centroid"]["x"],
                "y_centroid": topic["centroid"]["y"],
                "size": topic["size"],
                "top_doc_id": None,
                "top_term_id": None,
                "convex_hull": {
                    "x_coordinates": topic["convex_hull"]["x_coordinates"],
                    "y_coordinates": topic["convex_hull"]["y_coordinates"]
                }
            }
            f.write(json.dumps(transformed_topic))
            if i != len(source_data["topics"]) - 1:
                f.write(',')

        # Clôture de l'objet JSON de niveau supérieur
        f.write(']}')

def launch_web_app(source_data):
    output_file_path = Path('..') / '..' / 'web' / 'public'
    transform_and_write(source_data, output_file_path)
    # Change to the app directory
    subprocess.Popen(['make', 'startweb'])

    # Give the server some time to start up before opening the browser.
    time.sleep(5)

    # Open the browser
    webbrowser.open("http://localhost:3000")