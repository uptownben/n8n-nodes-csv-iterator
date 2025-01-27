import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GoogleDriveOAuth2Api implements ICredentialType {
	name = 'googleDriveOAuth2Api';
	extends = ['googleOAuth2Api'];
	displayName = 'Google Drive OAuth2 API';
	documentationUrl = 'https://developers.google.com/drive/api/v3/about-auth';
	properties: INodeProperties[] = [
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'https://www.googleapis.com/auth/drive.readonly',
		},
	];
}
