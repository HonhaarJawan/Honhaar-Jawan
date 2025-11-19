export async function getThinkificKeys() {
  console.log("Fetching Thinkific keys...");

  const data = {
    secret_key: process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
    sub_doman: process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
  };

  return {
    NEXT_PUBLIC_THINKIFIC_API_KEY: data.secret_key,
    NEXT_PUBLIC_THINKIFIC_SUBDOMAIN: data.sub_doman,
    baseUrl: "https://api.thinkific.com/api/public/v1",
  };
}
