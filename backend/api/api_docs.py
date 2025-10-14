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
                    "email_sent": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "Job": "my_rna_job",
                    "email_sent": True,
                }
            },
        ),
        400: openapi.Response(
            description="Bad request - missing data or invalid email",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                    "email_sent": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
            ),
            examples={
                "application/json": {
                    "success": False,
                    "error": "Missing RNA data.",
                    "email_sent": False,
                }
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
            ),
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
get_results_schema = swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter(
            "uid",
            openapi.IN_QUERY,
            description="Job UID (UUID)",
            type=openapi.TYPE_STRING,
            required=True,
            example="fdf137ee-4765-4347-876c-a8a7a4cf57ae",
        )
    ],
    responses={
        200: openapi.Response(
            description="Job results fetched successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "status": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Job status: P (Processing), F (Finished), E (Error)",
                    ),
                    "job_name": openapi.Schema(type=openapi.TYPE_STRING),
                    "input_structure": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Input RNA structure in FASTA format",
                    ),
                    "created_at": openapi.Schema(
                        type=openapi.TYPE_STRING, format="date-time"
                    ),
                    "sum_processing_time": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Total processing time (timedelta, formatted as 'HH:MM:SS.ssssss')",
                    ),
                    "result_list": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "completed_at": openapi.Schema(
                                    type=openapi.TYPE_STRING, format="date-time"
                                ),
                                "result_tetriary_structure": openapi.Schema(
                                    type=openapi.TYPE_STRING
                                ),
                                "result_secondary_structure_dotseq": openapi.Schema(
                                    type=openapi.TYPE_STRING
                                ),
                                "result_secondary_structure_svg": openapi.Schema(
                                    type=openapi.TYPE_STRING
                                ),
                                "result_arc_diagram": openapi.Schema(
                                    type=openapi.TYPE_STRING
                                ),
                                "f1": openapi.Schema(type=openapi.TYPE_NUMBER),
                                "inf": openapi.Schema(type=openapi.TYPE_NUMBER),
                                "seed": openapi.Schema(type=openapi.TYPE_INTEGER),
                                "processing_time": openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    description="Processing time for this result (timedelta, formatted as 'HH:MM:SS.ssssss')",
                                ),
                            },
                        ),
                    ),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "status": "F",
                    "job_name": "my_rna_job",
                    "input_structure": ">my_rna_job\nACGC\n....",
                    "created_at": "2025-09-15T21:27:57.298011Z",
                    "sum_processing_time": "4.530384",
                    "result_list": [
                        {
                            "completed_at": "2025-09-15T21:28:01.851603Z",
                            "result_tetriary_structure": "HEADER",
                            "result_secondary_structure_dotseq": ">strand_A\nAUCG\n....\n",
                            "result_secondary_structure_svg": '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">...</svg>',
                            "result_arc_diagram": '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">...</svg>',
                            "f1": None,
                            "inf": None,
                            "seed": 123456,
                            "processing_time": "4.530384",
                        }
                    ],
                }
            },
        ),
        400: openapi.Response(
            description="Invalid UID or job not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {"success": False, "error": "Job doesn't exist"},
            },
        ),
    },
)
get_suggested_seed_and_job_name_schema = swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response(
            description="Suggested seed and job name",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "seed": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "job_name": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "seed": 123456789,
                    "job_name": "job-20250915-2",
                }
            },
        )
    },
)
