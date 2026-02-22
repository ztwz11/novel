import { NextResponse } from 'next/server';
import { getAllGenrePresets } from '@/lib/genre/genre-presets';

export async function GET() {
    return NextResponse.json(getAllGenrePresets());
}
