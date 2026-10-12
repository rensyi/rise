import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { type Data, backupName, makeBackup, parseBackup } from './storage';

export type PickedBackup = { name: string; data: Data };

// Writes everything to one file and hands it to the phone's share sheet, where
// the user chooses where it goes.
export async function shareBackup(data: Data): Promise<void> {
  const now = new Date();
  const file = new File(Paths.cache, backupName(now));
  file.create({ overwrite: true });
  file.write(makeBackup(data, now));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your Rise backup' });
}

// Lets the user choose a file. Resolves to null if they cancel, and rejects if
// the file is not a Rise backup. Nothing is changed here.
export async function pickBackup(): Promise<PickedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync();
  if (result.canceled) return null;
  const { uri, name } = result.assets[0];
  const data = parseBackup(await new File(uri).text());
  if (!data) throw new Error('not a Rise backup');
  return { name, data };
}
