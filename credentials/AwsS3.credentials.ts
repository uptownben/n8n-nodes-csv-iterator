import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AwsS3 implements ICredentialType {
	name = 'awsS3';
	displayName = 'AWS S3';
	documentationUrl = 'https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/';
	properties: INodeProperties[] = [
		{
			displayName: 'Region',
			name: 'region',
			type: 'string',
			default: 'us-east-1',
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}
