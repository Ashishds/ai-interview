import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def test_ses():
    client = boto3.client(
        'ses',
        region_name=os.environ.get('AWS_REGION'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    )
    
    sender = os.environ.get('AWS_SES_FROM_EMAIL')
    recipient = sender # Send to self for test
    
    print(f"Testing SES: From {sender} To {recipient} in {os.environ.get('AWS_REGION')}")
    
    try:
        response = client.send_email(
            Source=sender,
            Destination={'ToAddresses': [recipient]},
            Message={
                'Subject': {'Data': 'SES Test from HireAI'},
                'Body': {'Text': {'Data': 'If you see this, SES is working!'}}
            }
        )
        print(f"Success! Message ID: {response['MessageId']}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_ses()
