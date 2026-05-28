import os
import sys
import time

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

GRAPHCMS_ENDPOINT = os.getenv("NEXT_PUBLIC_GRAPHCMS_ENDPOINT")
HYGRAPH_WRITE_TOKEN = os.getenv("HYGRAPH_WRITE_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
    "Content-Type": "application/json",
    "hyg-include-system-models": "true",
}


def fetch_drafts() -> list[dict]:
    query = """
    {
      blogs(stage: DRAFT, first: 100) {
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
    return data.get("data", {}).get("blogs", [])


def publish_blog(blog_id: str) -> dict:
    mutation = """
    mutation {
      publishBlog(where: { id: "%s" }, to: PUBLISHED) {
        id
        title
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
    print("Publish Drafts Agent starting...")
    if not all([GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN]):
        raise EnvironmentError("Missing one or more required environment variables.")

    drafts = fetch_drafts()
    print(f"Found {len(drafts)} draft(s).")

    if not drafts:
        print("Nothing to publish.")
        return

    for blog in drafts:
        blog_id = blog["id"]
        title = blog.get("title", blog_id)
        print(f"  Publishing: {title}")
        time.sleep(1)
        try:
            result = publish_blog(blog_id)
            if "errors" in result:
                print(f"  Error: {result['errors']}")
            else:
                published = result.get("data", {}).get("publishBlog", {})
                print(f"  Published: id={published.get('id')}")
        except Exception as e:
            print(f"  Request error: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
