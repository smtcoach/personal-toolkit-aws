# Express backend infrastructure

This stack runs the CloudDesk Express API on one cost-conscious EC2 instance.
It is separate from the existing SAM stack so the Lambda API remains available
during migration.

The stack creates:

- a new DynamoDB tasks table;
- an ECR repository;
- an encrypted S3 bucket for short-lived build sources;
- a temporary CodeBuild project used to build Docker images;
- one `t3.micro` EC2 instance with Docker;
- an Elastic IP, security group, IAM instance role, and SSM access.

CloudFront is intentionally updated only after the new API has passed its direct
health and authentication checks.

Future application releases use `.github/workflows/deploy-express.yml`. The
workflow packages the backend, asks CodeBuild to build and push an immutable
commit-tagged image, then uses Systems Manager to update the EC2 container.

The EC2 instance has no SSH key or port 22 rule. Use Systems Manager Session
Manager when shell access is needed.
