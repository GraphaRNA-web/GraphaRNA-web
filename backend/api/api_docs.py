from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

process_request_data_schema = swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "fasta_raw": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="RNA sequence in FASTA format as raw text input",
            ),
            "fasta_file": openapi.Schema(
                type=openapi.TYPE_STRING,
                format="binary",
                description="RNA sequence uploaded via FASTA file",
            ),
            "seed": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Random seed (integer). If not provided, a random one will be generated.",
            ),
            "job_name": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Custom job name. If not provided, one will be auto-generated.",
            ),
            "email": openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_EMAIL,
                description="User email address for notifications.",
            ),
            "alternative_conformations": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Number of alternative conformations to calculate (with seed incrementation). Default is 1.",
            ),
        },
        example={
            "fasta_raw": "CGCGGAACG CGGGACGCG\n((((...(( ))...))))",
            "seed": 123456,
            "job_name": "my_rna_job",
            "email": "user@example.com",
            "alternative_conformations": "2",
        },
    ),
    responses={
        200: openapi.Response(
            description="Job created successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "Job": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={"application/json": {"success": True, "Job": "my_rna_job"}},
        ),
        400: openapi.Response(
            description="Bad request - missing data or invalid email",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {"success": False, "error": "Missing RNA data."}
            },
        ),
        422: openapi.Response(
            description="RNA validation failed",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "Validation Result": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "Error List": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_STRING),
                    ),
                    "Validated RNA": openapi.Schema(type=openapi.TYPE_STRING),
                    "Mismatching Brackets": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_INTEGER),
                        description="List of positions with unpaired brackets",
                    ),
                    "Incorrect Pairs": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_INTEGER),
                            description="List of [i, j] pairs with incorrect base pairing",
                        ),
                    ),
                    "Fix Suggested": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
                examples={
                    "application/json": {
                        "Validation Result": False,
                        "Error List": ["RNA contains invalid characters: X"],
                        "Validated RNA": "",
                        "Mismatching Brackets": [],
                        "Incorrect Pairs": [],
                        "Fix Suggested": False,
                    }
                },
            ),
        ),
    },
)


validate_rna_schema = swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "RNA": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="RNA sequence in dot-bracket notation",
            ),
        },
        example={
            "RNA": ">example1\ngCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))...."
        },
        required=["RNA"],
    ),
    responses={
        200: openapi.Response(
            description="Validation successful, fix proposed if needed",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "Validation Result": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "Error List": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_STRING),
                    ),
                    "Validated RNA": openapi.Schema(
                        type=openapi.TYPE_STRING,
                    ),
                    "Mismatching Brackets": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_INTEGER),
                        description="List of positions with unpaired brackets",
                    ),
                    "Incorrect Pairs": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_INTEGER),
                        ),
                        description="List of [i, j] pairs with incorrect base pairing",
                    ),
                    "Fix Suggested": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
            ),
            examples={
                "application/json": {
                    "Validation Result": True,
                    "Error List": [],
                    "Validated RNA": "GCGGAUUUAGCUCAGUUGGGAGAGCGCCAGACUGAAGAUCUGGAGGUCCUGUGUUCGAUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
                    "Mismatching Brackets": [],
                    "Incorrect Pairs": [],
                    "Fix Suggested": False,
                }
            },
        ),
        422: openapi.Response(
            description="Validation failed, no fix proposed, error list provided",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "Validation Result": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "Error List": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_STRING),
                    ),
                    "Validated RNA": openapi.Schema(
                        type=openapi.TYPE_STRING,
                    ),
                    "Mismatching Brackets": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_INTEGER),
                        description="List of positions with unpaired brackets",
                    ),
                    "Incorrect Pairs": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_INTEGER),
                        ),
                        description="List of [i, j] pairs with incorrect base pairing",
                    ),
                    "Fix Suggested": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
            ),
            examples={
                "application/json": {
                    "Validation Result": False,
                    "Error List": ["DotBracket contains invalid brackets: q"],
                    "Validated RNA": "",
                    "Mismatching Brackets": [],
                    "Incorrect Pairs": [],
                    "Fix Suggested": False,
                }
            },
        ),
    },
)
