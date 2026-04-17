import boto3
from app.core.config import settings

def generate_presigned_url_if_s3(url: str) -> str:
    """If the URL is an AWS S3 URL, generate a presigned URL so private files can be viewed."""
    if not url or "amazonaws.com" not in url:
        return url
    try:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        # S3 URL format typically: https://<bucket>.s3.<region>.amazonaws.com/<key>
        key = url.split(".amazonaws.com/")[-1]
        
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key},
            ExpiresIn=3600 # 1 hour
        )
        return presigned_url
    except Exception as e:
        print(f"DEBUG: Presigned URL generation failed: {e}")
        return url
