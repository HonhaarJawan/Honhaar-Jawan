export const Test_Failed = async ({
  email,
  fullName,
  addListId,
  removeListId,
  htmlTemplate,
  subject,
  testMarks,
}) => {
  const MakeCall = await fetch(
    "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzNjA0MzE1MjZkNTUzMjUxMzQi_pc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        fullName,
        addListId,
        removeListId,
        htmlTemplate,
        subject,
        testMarks,
      }),
    }
  );

  const data = await MakeCall.json();

  return data;
};
export const Enrollment = async ({
  fullName,
  email,
  password,
  addListId,
  removeListId,
  classesStartingListId,
  admissionDate,
  admissionDelay,
}) => {
  const MakeCall = await fetch(
    "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzNjA0MzE1MjZhNTUzNjUxMzIi_pc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        addListId,
        removeListId,
        classesStartingListId,
        admissionDate,
        admissionDelay,
      }),
    }
  );

  const data = await MakeCall.json();

  return data;
};
export const Entry_List = async ({ email, addListId, fullName }) => {
  const MakeCall = await fetch(
    "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzNTA0MzA1MjZiNTUzMjUxMzUi_pc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        addListId,
        fullName,
      }),
    }
  );

  const data = await MakeCall.json();

  return data;
};
export const Archive_User = async ({
  email,
  fullName,
  password,
  archiveDate,
}) => {
  const MakeCall = await fetch(
    "https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMzA0M2M1MjY1NTUzMTUxMzMi_pc",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        fullName,
        password,
        archiveDate,
      }),
    }
  );

  const data = await MakeCall.json();

  return data;
};
