# utils.py

import math

def parseFastaFile(filename : str) -> str:
    """
    This function takes .fasta file in any format (diffrent strands in diffrent lines or separeted with a ' ') 
    and parses it in a way that can be read by a model. The final name of the strand is set to the filename param
    For example with an input file:
    >tsh_helix
    CGCGGAACG CGGGACGCG
    ((((...(( ))...))))
    the funcion outputs: >dotseq.fasta\nCGCGGAACG CGGGACGCG\n((((...(( ))...))))
    and for:
    >strand_A
    aGCGCCuGGACUUAAAGCCAUUGCACU
    ..((((.((((((((((((........
    >strand_B
    CCGGCUUUAAGUUGACGAGGGCAGGGUUuAUCGAGACAUCGGCGGGUGCCCUGCGGUCUUCCUGCGACCGUUAGAGGACU
    GGuAAAACCACAGGCGACUGUGGCAUAGAGCAGUCCGGGCAGGAA
    ..)))))))))))..(((...[[[[[[...)))......)))))...]]]]]][[[[[.((((((]]]]].....(((((
    (......((((((....)))))).......))))))..)))))).
    it returns:
    >test1.fasta\naGCGCCuGGACUUAAAGCCAUUGCACU CCGGCUUUAAGUUGACGAGGGCAGGGUUuAUCGAGACAUCGGCGGGUGCCCUGCGGUCUUCCUGCGACCGUUAGAGGACUGGuAAAACCACAGGCGACUGUGGCAUAGAGCAGUCCGGGCAGGAA\n..((((.((((((((((((........ ..)))))))))))..(((...[[[[[[...)))......)))))...]]]]]][[[[[.((((((]]]]].....((((((......((((((....)))))).......))))))..)))))). 
    """

    VALID_LETTERS = set("ACGUacguTt ")
    VALID_BRACKETS = set(".()[]<>{}AaBbCcDd ")

    with open(filename, "r") as f:
        strands = []
        dotbrackets = []
        current_seq: list[str] = []
        current_db: list[str] = []

        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            if line.startswith(">"):
                if current_seq or current_db:
                    if current_seq:
                        strands.append("".join(current_seq))
                    if current_db:
                        dotbrackets.append("".join(current_db))
                    current_seq = []
                    current_db = []
                continue

            line_clean = line
            chars = set(line_clean)

            if chars <= VALID_LETTERS:
                current_seq.append(line_clean)
            elif chars <= VALID_BRACKETS:
                current_db.append(line_clean)
            else:
                print(f"Skipped line with illegal chars: {line}")

        if current_seq:
            strands.append("".join(current_seq))
        if current_db:
            dotbrackets.append("".join(current_db))

    joined_seq = " ".join(strands)
    joined_db = " ".join(dotbrackets)


    return f">{filename}\n{joined_seq}\n{joined_db}"


def get_inf_f1(target : set, model : set) -> tuple[float, float]:
    """
    This function calculates the inf and f1 values. Input data can be generated using dotbracketToPairs function
    """
    tp = len(target & model)
    fp = len(model - target)
    fn = len(target - model)

    ppv = tp / (tp + fp)
    tpr = tp / (tp + fn)
    inf = math.sqrt(ppv * tpr)
    f1 = (2*tp)/(2*tp+fp+fn)

    return inf, f1

def dotbracketToPairs(input : str) -> tuple[str, list, str, set[tuple[int, int]]]:
    """
    This function takes input in a .fasta file format:
    # example comment\n>strandName\nGCGGAUUUAGCUCAGUUGGG\n((((....))))........
    if a file has multiple strands they shall be wirtten in the following way seperated by a ' ':
    #example\n>name\nGCG UAU\n.(. .).

    And translates it to a set of pairs (in this case [(1,12), (2,11), (3,10), (4,9)]).
    Additionaly it validates a structure.
    Return is in the following format: 
    "OK" / "WARNING" / "ERROR | list of Warnings / errors | corrected dotbracket (if warning) | set of pairs
    """
    VALID_LETTERS = "ACGUacguTt"
    VALID_BRACKETS = ".()[]<>{}AaBbCcDd"
    OPENING_BRACKETS = "([<{ABCD"
    CLOSING_BRACKETS = ")]>}abcd"
    VALID_CONNECTIONS = [["G", "C"], ["C", "G"], ["A", "U"], ["U", "A"], ["G", "U"], ["U", "G"]]

    dict_stacks : dict[str, list[tuple[int, str]]]= {}
    pairs: set[tuple[int, int]] = set()
    strand = ""
    dotbracket = ""

    errors : list[str] = []
    warnings : list[str] = []


    for line in input.split("\n"):
        if line[0] in "#>":
            continue
        if strand == "":
            strand = line.strip().replace(" ", "")
        else:
            dotbracket = line.strip().replace(" ", "")

    if len(strand) != len(dotbracket):
        # print("ERROR: strand and bracket length not equal")
        errors.append("ERROR: strand and bracket length not equal")
        return "ERROR", errors, "", pairs
            
    for i, letter in enumerate(strand):
        if letter not in VALID_LETTERS:
            # print(f"ERROR: letter on {i+1} position is not valid")
            errors.append(f"ERROR: letter on position {i+1} is not valid")
    
    for i, bracket in enumerate(dotbracket):
        if bracket not in VALID_BRACKETS:
            # print(f"ERROR: Bracket on {i+1} position is not valid")
            errors.append(f"ERROR: Bracket on position {i+1} is not valid")

    if len(errors) > 0:
        return "ERROR", errors, "", pairs

    strand = strand.replace("T", "U").replace("t", "u").replace(" ", "")
    dotbracket = dotbracket.replace(" ", "")
    corrected_brackets: str = ""

    
    for i in range(len(strand)):
        letter = strand[i]
        bracket = dotbracket[i]
        if bracket == ".":
            continue
        elif bracket not in dict_stacks and bracket in OPENING_BRACKETS:
            dict_stacks[bracket] = [(i+1, letter)]
        elif bracket in OPENING_BRACKETS:
            dict_stacks[bracket].append((i+1, letter))
        elif bracket in CLOSING_BRACKETS:
            opening = OPENING_BRACKETS[CLOSING_BRACKETS.find(bracket)]
            # safeguard so that we don't pop an empty list
            if opening not in dict_stacks or dict_stacks[opening] == []:
                # print(f"WARNING: Bracket on {i+1} position does not have an opening bracket")
                warnings.append(f"WARNING: Bracket on position {i+1} does not have an opening bracket")
                corrected_brackets = dotbracket[:i] + "." + dotbracket[i+1:]
            else:
                starting_index, starting_letter = dict_stacks[opening].pop()
                if [starting_letter, letter] not in VALID_CONNECTIONS:
                    warnings.append(f"WARNING: Brackets on {starting_index} and {i+1} are not valid connections")
                    # print(f"WARNING: Proteins on {starting_index}, {i+1} are connected, but shouldn't!")
                    corrected_brackets = dotbracket[ : starting_index - 1] + "." + dotbracket[starting_index : i] + "." + dotbracket[i+1]
                else:
                    pairs.add((starting_index, i+1))
            
    if len(warnings) > 0:
        return "WARNING", warnings, corrected_brackets, pairs
    return "OK", [], "", pairs
