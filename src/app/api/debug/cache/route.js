import { NextResponse } from 'next/server';
import cache from '@/lib/cache';

export async function GET() {
  try {
    const stats = cache.getStats();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    cache.clear();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 