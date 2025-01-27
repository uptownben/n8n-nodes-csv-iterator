# n8n-nodes-csv-iterator

This is an n8n community node that provides a CSV Iterator node for processing large CSV files row by row. It supports reading CSV files from local filesystem, Google Drive, or AWS S3 without loading the entire file into memory, making it ideal for processing large datasets efficiently.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Features

- **Multiple Source Support**: Read CSV files from:
  - Local filesystem
  - Google Drive
  - AWS S3

- **Memory Efficient**: Processes CSV files row by row without loading the entire file into memory
- **Configurable CSV Options**:
  - Custom delimiter support
  - Header row handling
  - Empty line skipping
- **Processing Control**: Configurable delay between processing rows to manage resource usage
- **Dual Outputs**: 
  - 'loop' output for each processed row
  - 'done' output when processing is complete

## Configuration

### Source Options

1. **Local File**
   - Required: File path to the CSV file

2. **Google Drive**
   - Required: File ID from Google Drive
   - Requires Google Drive OAuth2 credentials

3. **AWS S3**
   - Required: Bucket name and file key
   - Requires AWS S3 credentials

### CSV Options

- **Delimiter**: Character used to separate fields (default: ',')
- **Has Header**: Whether the CSV file contains a header row (default: true)
- **Skip Empty Lines**: Option to skip empty lines in the CSV (default: true)

### Processing Options

- **Processing Delay**: Optional delay (in milliseconds) between processing rows

## Credentials

The node requires appropriate credentials based on the chosen source:

- **Google Drive**: OAuth2 credentials (Client ID, Client Secret)
- **AWS S3**: Access Key ID and Secret Access Key

## Usage

1. Add the CSV Iterator node to your workflow
2. Select the source type (Local, Google Drive, or S3)
3. Configure the source-specific settings
4. Optional: Adjust CSV parsing options and processing delay
5. Connect the 'loop' output to nodes that should process each row
6. Connect the 'done' output to nodes that should run after all rows are processed

The node will read the CSV file row by row, outputting each row as a JSON object through the 'loop' output. Once all rows are processed, it will trigger the 'done' output.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Google Drive API documentation](https://developers.google.com/drive/api/v3/about-sdk)
* [AWS S3 SDK documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
