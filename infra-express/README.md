# Express backend infrastructure

The `clouddesk-express` CloudFormation stack creates:

- one EC2 instance running Docker;
- one DynamoDB tasks table;
- one private ECR repository;
- one deployment S3 bucket;
- one CodeBuild project;
- an Elastic IP, security group, IAM role, and SSM access.

The application does not use nginx, an Application Load Balancer, or a NAT
Gateway. CloudFront forwards `/api/v1/*` requests to the EC2 origin.

Application deployments use `.github/workflows/deploy-express.yml`. CodeBuild
creates the image and Systems Manager replaces the running container.
