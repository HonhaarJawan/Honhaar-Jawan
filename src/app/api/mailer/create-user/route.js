import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email, firstName, lastName } = await req.json()

    // Validate input
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user in mailer system (without adding to any list)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MAILER_APIENDPOINT}/subscribers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: process.env.NEXT_PUBLIC_MAILER_API_TOKEN,
          EMAIL: email,
          FIRST_NAME: firstName,
          LAST_NAME: lastName,
          tags: ['Honhaar Jawan'],
          status: 'subscribed',
          // Note: No list_uid specified, so user won't be added to any list
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create user')
    }

    return NextResponse.json(
      { message: 'User created in mailer system successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating user in mailer system:', error)
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }
}