import os
import requests
from dotenv import load_dotenv

def main():
    print("Loading environment variables from .env.local...")
    load_dotenv('.env.local')
    
    token = os.getenv('HYGRAPH_WRITE_TOKEN')
    if not token:
        print("❌ Error: HYGRAPH_WRITE_TOKEN not found in .env.local")
        return

    # User provided Management API endpoint
    endpoint = "https://management-us-west-2.hygraph.com/graphql"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    def run_mutation(mutation, variables):
        response = requests.post(endpoint, json={"query": mutation, "variables": variables}, headers=headers)
        data = response.json()
        if "errors" in data:
            # Check if error is because it already exists
            msg = data["errors"][0].get("message", "")
            if "already exists" in msg.lower() or "not unique" in msg.lower():
                return {"status": "skipped", "message": "Already exists"}
            return {"status": "error", "message": msg, "full_error": data["errors"]}
        return {"status": "success", "data": data.get("data")}

    # 1. Create Enumerations
    print("\n--- Creating Enumerations ---")
    enums = [
        {
            "apiId": "Importance",
            "displayName": "Importance",
            "values": [{"apiId": "LOW", "displayName": "Low"}, {"apiId": "MEDIUM", "displayName": "Medium"}, {"apiId": "HIGH", "displayName": "High"}]
        },
        {
            "apiId": "AiTool",
            "displayName": "AI Tool",
            "values": [{"apiId": "CLAUDE", "displayName": "Claude"}, {"apiId": "GPT", "displayName": "GPT"}, {"apiId": "GEMINI", "displayName": "Gemini"}, {"apiId": "OTHER", "displayName": "Other"}]
        },
        {
            "apiId": "TechnicalDepth",
            "displayName": "Technical Depth",
            "values": [{"apiId": "BEGINNER", "displayName": "Beginner"}, {"apiId": "INTERMEDIATE", "displayName": "Intermediate"}, {"apiId": "ADVANCED", "displayName": "Advanced"}]
        }
    ]

    create_enum_mutation = """
    mutation CreateEnumeration($apiId: String!, $displayName: String!, $values: [EnumValueCreateInput!]!) {
      createEnumeration(data: {apiId: $apiId, displayName: $displayName, values: $values}) {
        apiId
      }
    }
    """

    for enum in enums:
        res = run_mutation(create_enum_mutation, enum)
        if res["status"] == "success":
            print(f"✅ Created Enumeration: {enum['apiId']}")
        elif res["status"] == "skipped":
            print(f"⏭️  Skipped Enumeration: {enum['apiId']} (Already exists)")
        else:
            print(f"❌ Error creating Enumeration {enum['apiId']}: {res['message']}")


    # 2. Create Fields for Blog Model
    print("\n--- Creating Fields for Blog Model ---")
    model_api_id = "Blog"
    
    fields = [
        {"type": "ENUM", "apiId": "importance", "displayName": "Importance", "enumerationApiId": "Importance"},
        {"type": "STRING", "apiId": "importanceReason", "displayName": "Importance Reason"},
        {"type": "STRING", "apiId": "sourceUrl", "displayName": "Source URL"},
        {"type": "STRING", "apiId": "sourceName", "displayName": "Source Name"},
        {"type": "ENUM", "apiId": "aiTool", "displayName": "AI Tool", "enumerationApiId": "AiTool"},
        {"type": "STRING", "apiId": "aiToolVersion", "displayName": "AI Tool Version"},
        {"type": "BOOLEAN", "apiId": "canLearn", "displayName": "Can Learn"},
        {"type": "STRING", "apiId": "prerequisites", "displayName": "Prerequisites", "form": "markdown"},
        {"type": "STRING", "apiId": "learningRoadmap", "displayName": "Learning Roadmap", "form": "markdown"},
        {"type": "STRING", "apiId": "estimatedLearningTime", "displayName": "Estimated Learning Time"},
        {"type": "BOOLEAN", "apiId": "canTest", "displayName": "Can Test"},
        {"type": "STRING", "apiId": "testingGuide", "displayName": "Testing Guide", "form": "markdown"},
        {"type": "STRING", "apiId": "codeExamples", "displayName": "Code Examples", "form": "markdown"},
        {"type": "ENUM", "apiId": "technicalDepth", "displayName": "Technical Depth", "enumerationApiId": "TechnicalDepth"},
        {"type": "STRING", "apiId": "actionSuggestion", "displayName": "Action Suggestion"},
        {"type": "BOOLEAN", "apiId": "isAiGenerated", "displayName": "Is AI Generated"}
    ]

    create_field_mutation = """
    mutation CreateField($modelApiId: String!, $apiId: String!, $displayName: String!, $type: FieldType!, $enumerationApiId: String, $form: String) {
      createField(
        modelApiId: $modelApiId
        data: {
          apiId: $apiId
          displayName: $displayName
          type: $type
          enumerationApiId: $enumerationApiId
          form: $form
        }
      ) {
        apiId
      }
    }
    """

    for field in fields:
        variables = {
            "modelApiId": model_api_id,
            "apiId": field["apiId"],
            "displayName": field["displayName"],
            "type": field["type"]
        }
        if "enumerationApiId" in field:
            variables["enumerationApiId"] = field["enumerationApiId"]
        if "form" in field:
            variables["form"] = field["form"]

        res = run_mutation(create_field_mutation, variables)
        if res["status"] == "success":
            print(f"✅ Created Field: {field['apiId']}")
        elif res["status"] == "skipped":
            print(f"⏭️  Skipped Field: {field['apiId']} (Already exists)")
        else:
            print(f"❌ Error creating Field {field['apiId']}: {res['message']}")


    print("\n--- Summary ---")
    print("Execution finished. Please check your Hygraph dashboard to review the changes.")
    print("NOTE: You must 'Publish' the schema changes in the Hygraph UI before using the new fields in the Content API.")

if __name__ == "__main__":
    main()
