**AWS Deployment**

**Work Done**

I deployed the React frontend and Express backend to an Amazon Linux EC2 instance in the Sydney AWS region. The existing MySQL RDS database remained private in the same VPC. Its security group allows MySQL traffic from the EC2 application security group, not from the public internet.

I applied `server/db/schema.sql` to the existing RDS database and verified that the application tables were created. The backend was configured on EC2 with environment variables for its database, JWT, Gemini, and S3 settings. Secret values were entered on the server and were not committed to Git.

The EC2 instance uses an IAM role with access limited to the application's private S3 bucket. Material uploads are held in memory, copied to S3, and recorded in MySQL with an S3 object location:

APIs and AWS services used: Google Gemini API; application REST APIs for authentication, subjects, units, materials, summaries, mock practice, attempts, exams, planner, dashboard, performance, profile, and health; Amazon EC2, RDS (MySQL), S3, IAM, VPC, and security groups.

```javascript
const objectLocation = await putObject(
  `materials/${req.user.id}/${subject_id}/${storedFilename}`,
  req.file.buffer,
  req.file.mimetype
);
```

Authenticated API routes retrieve files from S3 for downloads and summary generation, and delete the S3 object when a material is removed. Nginx serves the production frontend and proxies API requests to Express. A `systemd` service keeps the backend running after logout or reboot.

The site is available at `http://studentacademicmanager.duckdns.org`.

**Problem Faced**

- SSH initially ignored the EC2 key because its Windows file permissions were too broad.
- The first backend database login failed because the password in the EC2 environment file was incorrect.
- The RDS database existed but initially had no application tables.
- The website was not publicly reachable until inbound HTTP traffic was allowed in the EC2 security group.
- A trailing space in the copied RDS endpoint caused a connection test to fail.

**Solution**

I restricted access to the SSH key file, corrected the database password in the EC2 environment file, applied the project schema, and removed the extra space from the RDS endpoint. The EC2 security group permits web traffic while SSH remains restricted; RDS accepts MySQL traffic from the EC2 security group only.

The production server uses environment configuration rather than hard-coded credentials:

```env
NODE_ENV=production
DB_HOST=<private-rds-endpoint>
DB_NAME=student_academic_manager
AWS_REGION=ap-southeast-2
S3_BUCKET=<private-bucket-name>
```

The frontend build succeeded. I verified the backend health endpoint, EC2-to-RDS connectivity, and S3 list/upload/download/delete permissions from EC2. I also confirmed that the public hostname serves the site and API health endpoint.

HTTPS has not been configured yet, so the current site uses unencrypted HTTP. Real or reused passwords should not be entered until HTTPS is enabled. The complete browser-based upload, download, delete, and summarization flow still needs end-to-end testing.
