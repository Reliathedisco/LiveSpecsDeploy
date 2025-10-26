import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export interface Auth0User {
  sub: string; // Auth0 user ID
  email?: string;
  name?: string;
  picture?: string;
}

export async function getAuth0User(request: NextRequest): Promise<Auth0User | null> {
  const res = new NextResponse();
  const session = await getSession(request, res);
  
  if (!session || !session.user) {
    return null;
  }
  
  return {
    sub: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
  };
}
