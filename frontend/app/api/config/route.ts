import { NextResponse } from 'next/server';

export async function GET() {

  const config = {
    rnaExample1: process.env.NEXT_PUBLIC_EXAMPLE_RNA_1 || "CCGAGUAGGUA\n((.....))..",
    rnaExample2: process.env.NEXT_PUBLIC_EXAMPLE_RNA_2 || "GACUUAUAGAU UGAGUCC\n(((((..(... )))))).",
    rnaExample3: process.env.NEXT_PUBLIC_EXAMPLE_RNA_3 || "UUAUGUGCC UGUUA AAUACAAUAG\n.....(... (.(.. ).....)..)",
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}