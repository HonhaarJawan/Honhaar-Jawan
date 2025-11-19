import axios from "axios";

/**
 * Registers a user in a new mailing list, then removes them from an old list.
 *
 * @param {object} args
 * @param {string} args.email - User's email
 * @param {string} args.firstName - User's first name
 * @param {string} args.lastName - User's last name
 * @param {string} args.newListUid - UID of the new mailing list
 * @param {string} [args.oldSubscriberUid] - The user's existing subscriber_id in old list (optional)
 * @param {string} args.apiToken - Acelle or mailer API token
 * @param {string} [args.baseUrl] - Base URL for the mailer API
 * @returns {Promise<{status: string, message?: string, newSubscriberUid?: string, error?: string}>}
 */
export async function registerUserInNewListAndRemoveFromOld({
  email,
  firstName,
  lastName,
  newListUid,
  oldListUid,
  oldSubscriberUid,
  apiToken,
  baseUrl = "https://mailer2.ansolutions.pk/api/v1"
}) {
  const logPrefix = "[Mailer]";
  console.log(`${logPrefix} Starting process for ${email}`, {
    newListUid,
    oldListUid,
    oldSubscriberUid,
  });

  try {
    // IMPORTANT: First completely delete the user from all lists if they have a subscriber ID
    if (oldSubscriberUid) {
      console.log(`${logPrefix} Completely removing subscriber ${oldSubscriberUid} from all lists`);
      
      try {
        // Using the proven deletion method you provided
        const unsubscribeResponse = await axios.delete(
          `${baseUrl}/subscribers/${oldSubscriberUid}`,
          {
            data: { api_token: apiToken },
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`${logPrefix} Successfully deleted subscriber from all lists`, unsubscribeResponse.data);
      } catch (deleteError) {
        console.error(`${logPrefix} Failed to delete subscriber from all lists`, {
          error: deleteError.response?.data || deleteError.message,
        });
        // Continue anyway - we'll try to add to new list regardless
      }
    }

    // Add to new list (no need to check if already in target list since we just deleted from all)
    console.log(`${logPrefix} Subscribing to new list ${newListUid}`);
    const payload = {
      list_uid: newListUid,
      EMAIL: email,
      FIRST_NAME: firstName,
      LAST_NAME: lastName,
      status: "subscribed",
    };

    const { data: newSub } = await axios.post(
      `${baseUrl}/subscribers`,
      payload,
      { params: { api_token: apiToken } }
    );

    console.log(`${logPrefix} Successfully subscribed to new list`, {
      newSubscriberId: newSub.subscriber_uid || newSub.subscriber_id
    });

    return {
      status: "success",
      newSubscriberUid: newSub.subscriber_uid || newSub.subscriber_id,
      message: "Successfully moved to new list",
    };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error(`${logPrefix} Critical error`, errorData);

    return {
      status: "failed",
      error: "Failed to process mailing list update",
      details: errorData,
    };
  }
}

