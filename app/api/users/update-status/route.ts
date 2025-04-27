import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['active', 'inactive', 'pending', 'banned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own status
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own status' },
        { status: 403 }
      );
    }

    // Update the user's status
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to "${status}" successfully`
    });
  } catch (error) {
    console.error('User status update error:', error);
    return NextResponse.json(
      { error: 'An error occurred during status update' },
      { status: 500 }
    );
  }
} 