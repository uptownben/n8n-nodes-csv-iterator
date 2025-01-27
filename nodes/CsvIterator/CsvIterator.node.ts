import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IExecuteFunctions,
} from 'n8n-workflow';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

export class CsvIterator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CSV Iterator',
		name: 'csvIterator',
		icon: 'file:csv.svg',
		group: ['input'],
		version: 1,
		description: 'Process CSV files row by row from various sources',
		defaults: {
			name: 'CSV Iterator',
		},
		inputs: ['main'],
		outputs: ['main', 'main'],
		outputNames: ['done', 'loop'],
		credentials: [
			{
				name: 'googleDriveOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						source: ['googleDrive'],
					},
				},
			},
			{
				name: 'awsS3',
				required: true,
				displayOptions: {
					show: {
						source: ['s3'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Local File',
						value: 'local',
					},
					{
						name: 'Google Drive',
						value: 'googleDrive',
					},
					{
						name: 'AWS S3',
						value: 's3',
					},
				],
				default: 'local',
				description: 'The source of the CSV file',
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						source: ['local'],
					},
				},
				description: 'Path to the local CSV file',
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						source: ['googleDrive'],
					},
				},
				description: 'ID of the file in Google Drive',
			},
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						source: ['s3'],
					},
				},
				description: 'Name of the S3 bucket',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						source: ['s3'],
					},
				},
				description: 'Key of the file in the S3 bucket',
			},
			{
				displayName: 'Processing Delay',
				name: 'delay',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				description: 'Time to wait (in milliseconds) before processing the next row',
			},
			{
				displayName: 'CSV Options',
				name: 'csvOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Delimiter',
						name: 'delimiter',
						type: 'string',
						default: ',',
						description: 'Character used to separate fields',
					},
					{
						displayName: 'Has Header',
						name: 'hasHeader',
						type: 'boolean',
						default: true,
						description: 'Whether the CSV file contains a header row',
					},
					{
						displayName: 'Skip Empty Lines',
						name: 'skipEmptyLines',
						type: 'boolean',
						default: true,
						description: 'Whether to skip empty lines',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const nodeContext = this.getContext('node');
		const source = this.getNodeParameter('source', 0) as string;
		const delay = this.getNodeParameter('delay', 0) as number;
		const csvOptions = this.getNodeParameter('csvOptions', 0, {}) as IDataObject;

		async function* getRowStream(
			readStream: Readable,
			csvOptions: IDataObject,
		): AsyncGenerator<IDataObject, void, unknown> {
			const parser = readStream.pipe(
				parse({
					delimiter: (csvOptions.delimiter as string) || ',',
					columns: csvOptions.hasHeader !== false,
					skip_empty_lines: csvOptions.skipEmptyLines !== false,
					relax_column_count: true,
				}),
			);

			for await (const record of parser) {
				yield record;
			}
		}

		// Initialize context if first run or reset
		if (!nodeContext.rowStream) {
			let readStream: Readable;

			switch (source) {
				case 'local': {
					const filePath = this.getNodeParameter('filePath', 0) as string;
					readStream = createReadStream(filePath);
					break;
				}
				case 'googleDrive': {
					const fileId = this.getNodeParameter('fileId', 0) as string;
					const credentials = await this.getCredentials('googleDriveOAuth2Api');

					const oauth2Client = new OAuth2Client({
						clientId: credentials.clientId as string,
						clientSecret: credentials.clientSecret as string,
						redirectUri: credentials.redirectUri as string,
					});

					oauth2Client.setCredentials({
						access_token: credentials.accessToken as string,
						refresh_token: credentials.refreshToken as string,
					});

					const driveClient = drive('v3');
					const response = await driveClient.files.get(
						{ fileId, alt: 'media' },
						{ responseType: 'stream' },
					);
					readStream = response.data as unknown as Readable;
					break;
				}
				case 's3': {
					const bucket = this.getNodeParameter('bucket', 0) as string;
					const key = this.getNodeParameter('key', 0) as string;
					const credentials = await this.getCredentials('awsS3');
					const client = new S3Client({
						credentials: {
							accessKeyId: credentials.accessKeyId as string,
							secretAccessKey: credentials.secretAccessKey as string,
						},
						region: credentials.region as string,
					});
					const command = new GetObjectCommand({ Bucket: bucket, Key: key });
					const response = await client.send(command);
					readStream = response.Body as Readable;
					break;
				}
				default:
					throw new NodeOperationError(this.getNode(), `Source ${source} is not supported`);
			}

			nodeContext.rowStream = getRowStream(readStream, csvOptions);
			nodeContext.done = false;
		}

		// Get next row
		const nextRow = await nodeContext.rowStream.next();

		// If no more rows, return done flag and empty loop output
		if (nextRow.done) {
			nodeContext.done = true;
			return [[{ json: { done: true } }], []];
		}

		// Return empty done output and current item in loop output
		const currentItem = { json: nextRow.value };

		// Schedule next execution after delay
		if (delay > 0) {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		// Return empty done output and current item in loop output
		return [[{ json: { done: false } }], [currentItem]];
	}
}
