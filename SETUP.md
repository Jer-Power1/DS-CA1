# Distributed Systems CA1 — Development Setup

## Local Environment

- Operating system: Windows
- IDE: Visual Studio Code
- Node.js: v26.13.0
- npm: 11.20.0
- Language: TypeScript
- Infrastructure: AWS CDK

## Setup Completed

1. Cloned the assignment starter repository.
2. Created a private GitHub repository for development.
3. Installed Node.js and npm.
4. Installed project dependencies using `npm.cmd ci`.
5. Successfully compiled the TypeScript project using `npm.cmd run build`.

## Build Verification

**Result: PASS**

The TypeScript compiler (`tsc`) completed without reporting errors.

## Notes

- PowerShell blocks the `npm.ps1` script, so `npm.cmd` is used.
- npm reported 21 dependency vulnerabilities during installation. These require review before deployment.
- The local Node.js version is 26, while the assignment targets Node.js 22 for AWS Lambda. Compatibility should be checked before deployment.

## Next Steps

- Review the existing Lambda functions.
- Implement missing GET endpoint functionality.
- Implement POST role creation.
- Complete API authentication and authorization.
- Deploy and test the application on AWS.