import { NextResponse } from 'next/server';

export async function GET() {

  const config = {
    rnaExample1: process.env.NEXT_PUBLIC_EXAMPLE_RNA_1 || "CCGAGUAGGUA\n((.....))..",
    rnaExample2: process.env.NEXT_PUBLIC_EXAMPLE_RNA_2 || "GACUUAUAGAU UGAGUCC\n(((((..(... )))))).",
    rnaExample3: process.env.NEXT_PUBLIC_EXAMPLE_RNA_3 || "UUAUGUGCC UGUUA AAUACAAUAG\n.....(... (.(.. ).....)..)",
    rnaExampleInt2string: process.env.NEXT_PUBLIC_EXAMPLE_INT_RNA_2_STR || "GACUUAUAGAU\n(((((..(...UGAGUCC\n)))))).",
    rnaExampleInt3string: process.env.NEXT_PUBLIC_EXAMPLE_INT_RNA_3_STR || "UUAUGUGCC\n.....(...UGUUA\n(.(..AAUACAAUAG\n).....)..)",
    rnaExampleInt1: process.env.NEXT_PUBLIC_EXAMPLE_INT_RNA_1 || ["CCGAGUAGGUA\n((.....)).."],
    rnaExampleInt2: process.env.NEXT_PUBLIC_EXAMPLE_INT_RNA_2 || ["GACUUAUAGAU\n(((((..(...", "UGAGUCC\n))))))."],
    rnaExampleInt3: process.env.NEXT_PUBLIC_EXAMPLE_INT_RNA_3 || ["UUAUGUGCC\n.....(...", "UGUUA\n(.(..", "AAUACAAUAG\n).....)..)"],

  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}