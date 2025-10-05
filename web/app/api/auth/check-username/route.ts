import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const existingUser = getUserByUsername(username);

    if (existingUser) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
