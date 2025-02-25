# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Pre-release

Intial commit prior to public release.

## [1.0.0] - Initial release

## [1.0.1] - API Gateway logging fix
Fix for issue with deployment when users try to deploy in an AWS account that has not been configured for API Gateway logging.

## [1.0.2] - Results filtering
Fix for results not being filtered properly when choosing to filter by date.

## [1.1] - Added support for CHAT, auto-verify admin user, and update to Node 16
Added support for surveys to accomodate the CHAT channel. In addition, the "admin" user created when the solution is deployed will now have their email address automatically verified allowing for a more robust password management workflow.
All runtimes for Lambda functions have also been updated to Node 16, with plans to update to Node 20 soon.

## [1.2] - nodejs22.x upgrade
All Lambdas now run with nodejs22.x runtime.
Architecture diagram updated to reflect chat support.
