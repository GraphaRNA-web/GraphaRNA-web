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

setup_test_job_schema = swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["fasta_file_name", "seed", "job_name", "job_status"],
        properties={
            "fasta_file_name": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Name of an existing FASTA file located in `/app/test_files/` (e.g., `example_sequence.fasta`).",
            ),
            "seed": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Random seed (integer) used for test reproducibility.",
            ),
            "email": openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_EMAIL,
                description="User email address for notifications (optional).",
            ),
            "alternative_conformations": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Number of alternative conformations to calculate (default: 1).",
            ),
            "job_name": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Custom job name for this test run.",
            ),
            "job_status": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Job status flag (e.g., 'Q' for queued, 'R' for running).",
            ),
            "sum_processing_time": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Total processing time for the job in seconds.",
            ),
        },
        example={
            "fasta_file_name": "example_sequence.fasta",
            "seed": 123456,
            "email": "user@example.com",
            "alternative_conformations": 2,
            "job_name": "test_job_1",
            "job_status": "Q",
            "sum_processing_time": 60,
        },
    ),
    responses={
        200: openapi.Response(
            description="Test job created successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                    "job_uuid": openapi.Schema(type=openapi.TYPE_STRING),
                    "job_hashed_uid": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "message": "Test data setup completed.",
                    "job_uuid": "8d87fbd4-23ff-47c9-9b8b-fd52727f18a7",
                    "job_hashed_uid": "abc12",
                }
            },
        ),
        400: openapi.Response(
            description="Bad request — missing or invalid input",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": False,
                    "error": "FASTA file not found.",
                }
            },
        ),
    },
)
cleanup_test_jobs_schema = swagger_auto_schema(
    method="delete",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["hashed_uids"],
        properties={
            "hashed_uids": openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Items(type=openapi.TYPE_STRING),
                description="List of hashed UIDs identifying test jobs to delete.",
            ),
        },
        example={
            "hashed_uids": ["abc12", "def34", "ghi56"],
        },
    ),
    responses={
        200: openapi.Response(
            description="Test jobs deleted successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                    "deleted_count": openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description="Number of deleted records (including cascaded JobResults).",
                    ),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "message": "Deleted 3 record(s) for provided hashed_uids.",
                    "deleted_count": 3,
                }
            },
        ),
        400: openapi.Response(
            description="Bad request — missing or invalid data",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": False,
                    "error": "Missing or invalid 'hashed_uids' list.",
                }
            },
        ),
        404: openapi.Response(
            description="No jobs found with the provided hashed_uids",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": False,
                    "error": "No jobs found matching provided hashed_uids.",
                }
            },
        ),
        500: openapi.Response(
            description="Internal server error",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "error": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": False,
                    "error": "Unexpected error while deleting jobs.",
                }
            },
        ),
    },
)


setup_test_job_results_schema = swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["job_uid"],
        properties={
            "job_uid": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="UUID of the existing Job for which results will be created.",
            ),
            "result_secondary_structure_dotseq": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Path to test .dotseq file located in /app/test_files/.",
            ),
            "result_secondary_structure_svg": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Path to test .svg file located in /app/test_files/.",
            ),
            "result_tertiary_structure": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Path to test .pdb or 3D structure file located in /app/test_files/.",
            ),
            "result_arc_diagram": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Path to test .png or .svg arc diagram located in /app/test_files/.",
            ),
            "f1": openapi.Schema(
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_FLOAT,
                description="F1 metric (0–1).",
                example=0.95,
            ),
            "inf": openapi.Schema(
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_FLOAT,
                description="INF metric (0–1).",
                example=0.88,
            ),
            "processing_time": openapi.Schema(
                type=openapi.TYPE_INTEGER,
                description="Processing time in seconds.",
                example=123,
            ),
        },
        example={
            "job_uid": "8d87fbd4-23ff-47c9-9b8b-fd52727f18a7",
            "result_secondary_structure_dotseq": "test_result.dotseq",
            "result_secondary_structure_svg": "test_result.svg",
            "result_tertiary_structure": "test_result.pdb",
            "result_arc_diagram": "test_result_arc.svg",
            "f1": 0.97,
            "inf": 0.90,
            "processing_time": 42,
        },
    ),
    responses={
        200: openapi.Response(
            description="JobResults test data created successfully.",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
            examples={
                "application/json": {
                    "success": True,
                    "message": "JobResults test data setup completed.",
                }
            },
        ),
        400: openapi.Response(
            description="Bad request or missing job_uid.",
            examples={
                "application/json": {
                    "success": False,
                    "error": "Job not found with provided UID.",
                }
            },
        ),
        500: openapi.Response(
            description="Internal server error during file setup or database save.",
            examples={
                "application/json": {
                    "success": False,
                    "error": "Unexpected error occurred while creating JobResults.",
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
                    "job_seed": openapi.Schema(type=openapi.TYPE_INTEGER),
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
                    "job_seed": 123456,
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
download_zip_file_schema = swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter(
            "uidh",
            openapi.IN_QUERY,
            description="UIDH of finished job.",
            type=openapi.TYPE_STRING,
            required=True,
            example="k5PEY",
        )
    ],
    responses={
        200: openapi.Response(
            description="ZIP file generated successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
                format="binary",
                description="ZIP file containing RNA structure results.",
            ),
            examples={"api/downloadZip": "ZIP file"},
        ),
        400: openapi.Response(
            description="Invalid UID or job not finished",
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
            ),
            examples={"text/plain": "UUID error"},
        ),
        404: openapi.Response(
            description="Job or file does not exist.",
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
            ),
            examples={"text/plain": "Job not found"},
        ),
    },
)


job_pagination_schema = swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter(
            "page",
            openapi.IN_QUERY,
            description="Page number to retrieve",
            type=openapi.TYPE_INTEGER,
            required=False,
            example=1,
        ),
        openapi.Parameter(
            "page_size",
            openapi.IN_QUERY,
            description="Number of items per page (max 100)",
            type=openapi.TYPE_INTEGER,
            required=False,
            example=10,
        ),
    ],
    responses={
        200: openapi.Response(
            description="Paginated list of jobs (finished or still active)",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "count": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "next": openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                    "previous": openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                    "results": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "uid": openapi.Schema(type=openapi.TYPE_STRING),
                                "hashed_uid": openapi.Schema(
                                    type=openapi.TYPE_STRING, nullable=True
                                ),
                                "input_structure": openapi.Schema(
                                    type=openapi.TYPE_STRING
                                ),
                                "seed": openapi.Schema(type=openapi.TYPE_INTEGER),
                                "job_name": openapi.Schema(type=openapi.TYPE_STRING),
                                "email": openapi.Schema(
                                    type=openapi.TYPE_STRING,
                                    format="email",
                                    nullable=True,
                                ),
                                "created_at": openapi.Schema(
                                    type=openapi.TYPE_STRING, format="date-time"
                                ),
                                "expires_at": openapi.Schema(
                                    type=openapi.TYPE_STRING, nullable=True
                                ),
                                "sum_processing_time": openapi.Schema(
                                    type=openapi.TYPE_STRING, nullable=True
                                ),
                                "status": openapi.Schema(type=openapi.TYPE_STRING),
                                "alternative_conformations": openapi.Schema(
                                    type=openapi.TYPE_INTEGER
                                ),
                            },
                        ),
                    ),
                },
            ),
            examples={
                "application/json": {
                    "count": 4,
                    "next": "http://127.0.0.1:8000/api/activeJobs/?page=2",
                    "previous": None,
                    "results": [
                        {
                            "uid": "94eeb28c-19cd-40b9-bb2c-ebda604a7795",
                            "hashed_uid": None,
                            "input_structure": "/engine_inputs/94eeb28c-19cd-40b9-bb2c-ebda604a7795.dotseq",
                            "seed": 561573671,
                            "job_name": "job-20250804-0",
                            "email": "test@example.com",
                            "created_at": "2025-08-04T21:54:01.537053+02:00",
                            "expires_at": None,
                            "sum_processing_time": None,
                            "status": "P",
                            "alternative_conformations": 1,
                        }
                    ],
                }
            },
        )
    },
)
