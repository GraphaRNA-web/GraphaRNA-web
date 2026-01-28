import os
import varnaapi
from api.validation_tools import RnaValidator
from xml.etree import ElementTree as ET
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
varna_path = os.path.join(CURRENT_DIR, "VARNAv3-93.jar")


def log_to_file(message: str) -> None:
    with open("/shared/celery_debug.log", "a") as f:
        f.write(message + "\n")


if not os.path.exists(varna_path):
    print("FILE NOT FOUND")
    raise FileNotFoundError(f"VARNA JAR not found at: {varna_path}")

varnaapi.set_VARNA(varna_path)


def getDotBracket(path: str) -> str:
    with open(path, "r") as f:
        return f.readlines()[2]


def getNucleotites(path: str) -> str:
    with open(path, "r") as f:
        return f.readlines()[1]

def crop_svg(input_svg: str, output_svg: str, padding: int = 10) -> None:
    tree = ET.parse(input_svg)
    root = tree.getroot()

    min_x, min_y = 999999999.0,999999999.0
    max_x, max_y = 0.0,0.0

    for elem in root:
        tag = elem.tag.split('}')[-1]
        if tag == 'line':
            x_vals = [float(elem.attrib['x1']), float(elem.attrib['x2'])]
            y_vals = [float(elem.attrib['y1']), float(elem.attrib['y2'])]
        elif tag == 'circle':
            cx = float(elem.attrib['cx'])
            cy = float(elem.attrib['cy'])
            r = float(elem.attrib.get('r', 0))
            x_vals = [cx - r, cx + r]
            y_vals = [cy - r, cy + r]
        elif tag == 'text':
            x_vals = [float(elem.attrib['x'])]
            y_vals = [float(elem.attrib['y'])]
        else:
            continue

        min_x = min(min_x, *x_vals)
        max_x = max(max_x, *x_vals)
        min_y = min(min_y, *y_vals)
        max_y = max(max_y, *y_vals)

    min_x -= padding
    min_y -= padding
    max_x += padding
    max_y += padding

    width = max_x - min_x
    height = max_y - min_y
    root.set('viewBox', f"{min_x} {min_y} {width} {height}")
    root.set('width', str(width))
    root.set('height', str(height))

    tree.write(output_svg)
def drawVARNAgraph(input_filepath: str, output_path: str) -> str:
    """
    Input:
    - .dotseq file
    - output file path
    This funciton uses VARNA in order to generate a 2D graph of a given structure and saves it in output_path.
    Output file should have a .svg extension
    """

    if not os.path.exists(input_filepath):
        return "ERROR: Input file does not exist"

    dotbracket: str = (
        getDotBracket(input_filepath).strip().replace(" ", "").replace("-", "")
    )
    seq: str = getNucleotites(input_filepath).strip().replace(" ", "").replace("-", "")

    if not seq:
        return "ERROR: Could not find sequence in file"
    if not dotbracket:
        return "ERROR: Could not find structure in file"

    
    v = varnaapi.Structure(sequence=seq, structure=dotbracket)
    v.savefig(f"{output_path}")
    crop_svg(f"{output_path}", f"{output_path}", padding=15)
    return f"OK: File at: {output_path}"

def generateRchieDiagram(
    fasta_input: str,
    fasta_output: str,
    output_img_path: str,
    grid_step: int = 20,
) -> str:
    """
    Input:
    1. The entire .dotseq of a structure that will be represented on the top half
    2. The entire .dotseq of a structure that will be represented on the bottom half
    3. Filepath of the output file (preferably .svg)
    4. OPTIONAL: Step of the grey scale markings

    Output: String of "OK " + output_img_path or "ERROR*" if any have occured.
    """
    import numpy as np
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    try:
        with open(fasta_input, "r") as f_in, open(fasta_output, "r") as f_out:
            fasta_content_input = f_in.read()
            fasta_content_output = f_out.read()
            fasta_content_input = fasta_content_input.replace(" ", "").replace("-", "")
            fasta_content_output = fasta_content_output.replace(" ", "").replace("-", "")

        input_lines = fasta_content_input.split("\n")
        output_lines = fasta_content_output.split("\n")

        nucleotites_input = input_lines[1].strip()

        validator_input = RnaValidator(fasta_content_input)
        result_input = validator_input.ValidateRna()
        input_pairs_0_indexed = set(result_input.get("allPairs", set()))
        input_pairs = {(i + 1, j + 1) for i, j in input_pairs_0_indexed}

        validator_output = RnaValidator(fasta_content_output)
        result_output = validator_output.ValidateRna()
        output_pairs_0_indexed = set(result_output.get("allPairs", set()))
        output_pairs = {(i + 1, j + 1) for i, j in output_pairs_0_indexed}

    except Exception as e:
        return f"ERROR: RnaValidator or file reading failed. Details: {e}"
    
    common_pairs = input_pairs & output_pairs
    missing_pairs = input_pairs - common_pairs
    added_pairs = output_pairs - common_pairs

    n = max(
        len(input_lines[1]),
        len(input_lines[2]),
        len(output_lines[1]),
        len(output_lines[2]),
    )

    if n == 0:
        return "ERROR: Input sequences or structures are empty."

    all_pairs = input_pairs | output_pairs
    max_span = max((j - i) for (i, j) in all_pairs) if all_pairs else 1
    max_r = max_span / 2.0 + 1

    total_arcs = len(all_pairs)
    lw = np.clip(1.5 * (50 / max(total_arcs, 1)), 0.5, 1.85)

    y_offset = max_r * 0.01
    
    text_y_pos = max_r + 2.0  
    total_plot_height = text_y_pos + 2.0

    seq_font_size = np.clip(300 / n, 5, 10)
    index_font_size = seq_font_size * 0.85

    fig, ax = plt.subplots(figsize=(n / 2.5, 5))
    theta = np.linspace(0, np.pi, 200)

    def draw_arc(i: int, j: int, color: str, top: bool = True) -> None:
        r = (j - i) / 2.0
        ys = r * np.sin(theta)
        xs = i + (j - i) * (1 - np.cos(theta)) / 2.0
        ys = (ys + y_offset) if top else (-ys - y_offset)
        ax.plot(xs, ys, color=color, lw=lw)

    for x in range(1, n + 1, grid_step):
        ax.vlines(x, -total_plot_height, total_plot_height, color="lightgrey", lw=0.5)

    for i in range(n):
        ax.text(
            i + 1,
            0,
            nucleotites_input[i],
            ha="center",
            va="top",
            fontsize=seq_font_size,
            fontfamily="monospace",
        )

        if (i + 1) % 10 == 0:
            ax.text(
                i + 1,
                0,
                str(i + 1),
                ha="center",
                va="bottom",
                fontsize=index_font_size,
                color="gray",
            )

    for i, j in missing_pairs:
        draw_arc(i, j, color="red", top=True)
    for i, j in common_pairs:
        draw_arc(i, j, color="green", top=True)

    for i, j in added_pairs:
        draw_arc(i, j, color="blue", top=False)
    for i, j in common_pairs:
        draw_arc(i, j, color="green", top=False)

    ax.text(
        1.0,
        text_y_pos,
        "Input Structure",
        color="black",
        fontsize=12,
        fontweight="bold",
        ha="left",
        va="bottom",
    )

    ax.text(
        1.0,
        -text_y_pos,
        "Output Structure",
        color="black",
        fontsize=12,
        fontweight="bold",
        ha="left",
        va="top",
    )

    legend_elements = [
        Line2D([0], [0], color="red", lw=2, label="Missing (Input only)"),
        Line2D([0], [0], color="green", lw=2, label="Common (Match)"),
        Line2D([0], [0], color="blue", lw=2, label="Added (Output only)"),
    ]

    ax.legend(
        handles=legend_elements,
        loc="upper center",
        bbox_to_anchor=(0.5, 0.0),
        fontsize="small",
        framealpha=1.0,
        borderaxespad=0.5,
        ncol=3
    )

    ax.set_xlim(0.5, n + 0.5)
    ax.set_ylim(-total_plot_height, total_plot_height)
    ax.set_aspect("equal")
    ax.axis("off")

    ax.annotate(
        "", xy=(n + 0.5, 0), xytext=(0.5, 0), arrowprops=dict(arrowstyle="->", lw=1)
    )

    plt.tight_layout()
    fig.savefig(output_img_path, dpi=150, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    return "OK " + output_img_path


