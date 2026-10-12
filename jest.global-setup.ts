// Fixed zone ahead of UTC with no DST, so local-date bugs fail on every machine.
export default async function globalSetup() {
  process.env.TZ = 'Asia/Manila';
}
