import os
import sys
import time

import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GRAPHCMS_ENDPOINT = os.getenv("NEXT_PUBLIC_GRAPHCMS_ENDPOINT")
HYGRAPH_WRITE_TOKEN = os.getenv("HYGRAPH_WRITE_TOKEN")

AUTHOR_ID = "cmppeedszsn6207myqv1mni6i"
DEFAULT_IMAGE_ID = "cmgpavuhj7r2807n8a5hpt1dh"

HEADERS = {
    "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
    "Content-Type": "application/json",
    "hyg-include-system-models": "true",
}


def fetch_posts_without_author() -> list[dict]:
    query = """
    {
      blogs(where: { author: null }, first: 100, stage: PUBLISHED) {
        id
        title
      }
    }
    """
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": query},
        headers=HEADERS,
    )
    response.raise_for_status()
    data = response.json()
    if "errors" in data:
        raise RuntimeError(data["errors"])
    return data.get("data", {}).get("blogs", [])


def update_post(blog_id: str) -> dict:
    mutation = """
    mutation {
      updateBlog(
        where: { id: "%s" }
        data: {
          author: { connect: { id: "%s" } }
          image: { connect: { id: "%s" } }
        }
      ) {
        id
        title
      }
    }
    """ % (blog_id, AUTHOR_ID, DEFAULT_IMAGE_ID)
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation},
        headers=HEADERS,
    )
    response.raise_for_status()
    return response.json()


def publish_post(blog_id: str) -> dict:
    mutation = """
    mutation {
      publishBlog(where: { id: "%s" }, to: PUBLISHED) {
        id
      }
    }
    """ % blog_id
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation},
        headers=HEADERS,
    )
    response.raise_for_status()
    return response.json()


def main():
    print("Fix Existing Posts Agent starting...")
    if not all([GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN]):
        raise EnvironmentError("Missing one or more required environment variables.")

    posts = fetch_posts_without_author()
    print(f"Found {len(posts)} published blog(s) with no author.")

    if not posts:
        print("Nothing to fix.")
        return

    for post in posts:
        blog_id = post["id"]
        title = post.get("title", blog_id)
        print(f"  Updating: {title}")
        time.sleep(1)
        try:
            result = update_post(blog_id)
            if "errors" in result:
                print(f"  Update error: {result['errors']}")
                continue
            updated = result.get("data", {}).get("updateBlog", {})
            print(f"  Updated:  id={updated.get('id')}")
            time.sleep(1)
            pub = publish_post(blog_id)
            if "errors" in pub:
                print(f"  Publish error: {pub['errors']}")
            else:
                print(f"  Published: id={blog_id}")
        except Exception as e:
            print(f"  Request error: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
