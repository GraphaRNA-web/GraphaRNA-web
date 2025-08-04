import numpy as np
import matplotlib.pyplot as plt
import os

import varnaapi

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
varna_path = os.path.join(CURRENT_DIR, "VARNAv3-93.jar")

def log_to_file(message: str):
    with open("/shared/celery_debug.log", "a") as f:
        f.write(message + "\n")

if not os.path.exists(varna_path):
    print("FILE NOT FOUND")
    raise FileNotFoundError(f"VARNA JAR not found at: {varna_path}")

varnaapi.set_VARNA(varna_path)

def drawVARNAgraph(filepath : str) -> str:
    """
    This function takes a .dotseq file and reads its secondary structure.
    Then it uses VARNA in order to generate the 2D graph and saves it under the input as {filepath}_VARNA.svg
    """

    VALID_LETTERS = set("ACGUacguTt ")
    VALID_BRACKETS = set(".()[]<>{}AaBbCcDd ")

    if not os.path.exists(filepath):
        return "ERROR: Input file does not exist"
    
    dotbracket : str = ""
    seq : str = ""
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip().replace(" ", "")
            if not line or line[0] in ">#":
                continue
            chars = set(line)
            if chars <= VALID_LETTERS:
                seq += line
            if chars <= VALID_BRACKETS:
                dotbracket += line
    
    if not seq:
        return "ERROR: Could not find sequence in file"
    if not dotbracket:
        return "ERROR: Could not find structure in file"
    
    output_path : str = filepath.replace(".dotseq", "")
    output_path += "_VARNA.svg"
    
    v = varnaapi.Structure(sequence = seq, structure = dotbracket)
    v.savefig(f"{output_path}")

    return f"OK: File at: {output_path}"


def getPairs(dotbracket : str) -> tuple[str, set[tuple[int, int]]]:
    """
    This function takes input as a single dotbracket sequence from a .dotseq file. 
    It returns a note (ERROR/OK) and a set of pairs of interactions between atoms [1..n]
    """
    VALID_BRACKETS = ".()[]<>{}AaBbCcDd "
    OPENING_BRACKETS = "([<{ABCD"
    CLOSING_BRACKETS = ")]>}abcd"


    dict_stacks : dict[str, list[int]]= {}
    pairs: set[tuple[int, int]] = set()

    errors : str = ""

    dotbracket = dotbracket.strip().replace(" ", "")

    if set(dotbracket) > set(VALID_BRACKETS):
        return ("ERROR - illegal brackets in input", pairs)
    
    i : int
    for i in range(len(dotbracket)):
        bracket = dotbracket[i]
        if bracket == ".":
            continue
        elif bracket not in dict_stacks and bracket in OPENING_BRACKETS:
            dict_stacks[bracket] = [i+1]
        elif bracket in OPENING_BRACKETS:
            dict_stacks[bracket].append(i+1)
        elif bracket in CLOSING_BRACKETS:
            opening = OPENING_BRACKETS[CLOSING_BRACKETS.find(bracket)]
            # safeguard so that we don't pop an empty list
            if opening not in dict_stacks or dict_stacks[opening] == []:
                errors += f"WARNING: Bracket on position {i+1} does not have an opening bracket"
            else:
                starting_index = dict_stacks[opening].pop()
                pairs.add((starting_index, i+1))

    
    return ("OK", pairs)

def getDotbracketFromDotseq(filepath : str) -> str:
    VALID_LETTERS = set("ACGUacguTt ")
    VALID_BRACKETS = set(".()[]<>{}AaBbCcDd ")

    if not os.path.exists(filepath):
        return "ERROR: Input file does not exist"
    
    dotbracket : str = ""
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip().replace(" ", "")
            if not line or line[0] in ">#":
                continue
            chars = set(line)
            if chars <= VALID_LETTERS:
                continue
            if chars <= VALID_BRACKETS:
                dotbracket += line
    
    if not dotbracket:
        return "ERROR: Could not find structure in file"
    return dotbracket


def generateRchieDiagram(dotbracket_input : str, dotbracket_output : str, output_img_path : str, grid_step: int = 20) -> str:
    """
    This function generates R-chie-like graph. 
    The top half represents the input structure and the bottom half represebts the output.
    Any onnections that have not been modeled by the engine are marked in red on the top half
    Any connections that have been added by the engine are marked in blue on the bottom half
    All matching connections are painted green
    Both input strings will be cleaned of white spaces and stripped 
    """
    dotbracket_input = dotbracket_input.strip().replace(" ", "")
    dotbracket_output = dotbracket_output.strip().replace(" ", "")

    input_pairs : set[tuple[int, int]] = set()
    output_pairs : set[tuple[int, int]] = set()

    status, input_pairs = getPairs(dotbracket_input)
    if status  != "OK":
        return status + " in input file."
    
    status, output_pairs = getPairs(dotbracket_output)
    if status  != "OK":
        return status + " in output file."
        
    common_pairs  = input_pairs  & output_pairs
    missing_pairs = input_pairs  - common_pairs
    added_pairs   = output_pairs - common_pairs

    n = max(len(dotbracket_input), len(dotbracket_output))
    all_pairs = input_pairs | output_pairs
    max_span  = max((j - i) for (i, j) in all_pairs) if all_pairs else 1
    max_r     = max_span / 2.0 + 1

    # max arc size
    total_arcs = len(all_pairs)
    lw = np.clip(1.5 * (50 / max(total_arcs, 1)), 0.5, 1.85)

    # offset from x
    y_offset = max_r * 0.005

    fig, ax = plt.subplots(figsize=(n/2, 4))

    theta = np.linspace(0, np.pi, 200)
    def draw_arc(i, j, color, top=True):
        r  = (j - i) / 2.0
        # cx = i + r
        ys = r * np.sin(theta)
        xs = i + (j - i) * (1 - np.cos(theta)) / 2.0
        if top:
            ys = ys + y_offset
        else:
            ys = -ys - y_offset
        ax.plot(xs, ys, color=color, lw=lw)

    for x in range(1, n+1, grid_step):
        ax.vlines(x, -max_r - y_offset, max_r + y_offset, color='lightgrey', lw=0.5)

    label_offset = max_r * 0.03

    for x in range(0, n, grid_step):
        ax.text(
            x, 
            max_r + y_offset + label_offset,
            str(x),
            ha='center',
            va='bottom',
            fontsize=8,
            color='lightgrey'
        )
        ax.text(
            x,
            -max_r - y_offset - label_offset,
            str(x),
            ha='center',
            va='top',
            fontsize=8,
            color='lightgrey'
        )

    for (i, j) in missing_pairs:
        draw_arc(i, j, color="red",   top=True)
    for (i, j) in common_pairs:
        draw_arc(i, j, color="green", top=True)

    for (i, j) in added_pairs:
        draw_arc(i, j, color="blue",  top=False)
    for (i, j) in common_pairs:
        draw_arc(i, j, color="green", top=False)

    ax.set_xlim(0.5, n + 0.5)
    ax.set_ylim(-max_r - y_offset, max_r + y_offset)
    ax.set_aspect("equal")
    ax.axis("off")

    ax.annotate(
        "", 
        xy=(n + 0.5, 0), 
        xytext=(0.5,    0),
        arrowprops=dict(arrowstyle="->", lw=1)
    )

    plt.tight_layout()
    fig.savefig(output_img_path, dpi=150, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    return output_img_path


