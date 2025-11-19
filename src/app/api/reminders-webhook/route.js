import { db } from "@/Backend/FirebaseAdminSDK";
import { registerUserInNewListAndRemoveFromOld } from "@/services/mailerUtils";
import { NextResponse } from "next/server";

export async function POST(request) {
  const logPrefix = "[Webhook]";
  console.log(`${logPrefix} Request received`);

  try {
    // 1. Validate input
    const email = request.headers.get("webhookfor");
    if (!email) {
      console.error(`${logPrefix} Missing email header`);
      return NextResponse.json(
        { error: "Missing 'webhookfor' header" },
        { status: 400 }
      );
    }
    console.log(`${logPrefix} Processing email: ${email}`);

    // 2. Get user data
    const userSnapshot = await db.collection("users")
      .where("email", "==", email)
      .get();

    if (userSnapshot.empty) {
      console.error(`${logPrefix} User not found`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    console.log(`${logPrefix} Found user`, {
      id: userDoc.id,
      email: user.email,
      subscriberId: user.subscriberId
    });

    if (!user.email || !user.subscriberId) {
      console.error(`${logPrefix} Incomplete user data`);
      return NextResponse.json(
        { error: "Incomplete user data" },
        { status: 400 }
      );
    }

    // 3. Prepare and validate payload
    const payload = {
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      oldListUid: process.env.NEXT_PUBLIC_EMAILING_PROFILE_REMINDER_LISTUID,  
      newListUid: process.env.NEXT_PUBLIC_EMAILING_ALL_USERS_LISTUID,
      oldSubscriberUid: user.subscriberId,
      apiToken: process.env.NEXT_PUBLIC_EMAILING_APITOKEN,
    };
    console.log(`${logPrefix} Prepared payload`, payload);

    // 4. Process mailing list update
    console.log(`${logPrefix} Starting list update`);
    const result = await registerUserInNewListAndRemoveFromOld(payload);

    if (result.status === "failed") {
      console.error(`${logPrefix} Mailer failed`, result.error);
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    // 5. Update Firestore if needed
    if (result.newSubscriberUid && !result.noChange) {
      console.log(`${logPrefix} Updating Firestore with new subscriber ID`);
      await userDoc.ref.update({
        subscriberId: result.newSubscriberUid,
        lastUpdated: new Date().toISOString()
      });
    }

    console.log(`${logPrefix} Completed successfully`);
    return NextResponse.json({
      message: result.message,
      newSubscriberId: result.newSubscriberUid
    });

  } catch (error) {
    console.error(`${logPrefix} Unexpected error`, error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
