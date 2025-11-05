from collections import deque
from django.conf import settings


class RnaValidator:
    def __init__(self, fasta_raw: str) -> None:
        self.fasta_raw: str = fasta_raw
        self.validBrackets: str = settings.VALID_BRACKETS + " "
        self.validNucleotides: set[str] = settings.VALID_NUCLEOTIDES + " "
        self.validPairs: list[str] = [
            settings.VALID_PAIRS[i : i + 2]
            for i in range(0, len(settings.VALID_PAIRS), 2)
        ]
        self.parsingResult: bool = True
        self.errorList: list[str] = []

        """# for debugging purpose
        self.validBrackets: str = "()<>[]{}AaBbCcDd." + " "
        self.validNucleotides: str = "AUGC" + " "
        self.validPairs: list[str] = ["GC", "CG", "AU", "UA", "GU", "UG"]
"""
        self.FastaFileParse()

    def FastaFileParse(self) -> None:
        """
        Converts strands to uppercase, replaces T with U, and joins them with spaces
        """
        nucleotides: str = ""
        dotBracket: str = ""

        inputStructureSplit: list[str] = [
            item.replace("-", " ").strip() #replace - with spaces (spaces needed for processing)
            for item in self.fasta_raw.split("\n")
            if (item.replace("-", " ").strip() != "" and item[0] != "#")
        ]  # remove empty lines and comments

        potentialNameLines: list[str] = inputStructureSplit[::3]
        areNameLines: list[bool] = [i[0] == ">" for i in potentialNameLines]
        if all(areNameLines):  # check if all input lines contains strand names
            containsStrandNames: bool = True
        elif any(areNameLines):  # check if any input lines contains strand names
            self.parsingResult = False
            self.errorList.append("Parsing error: Inconsistent strand naming")
            return None
        else:
            containsStrandNames = False

        if containsStrandNames:
            for i in range(0, len(inputStructureSplit), 3):
                currentStrand: list[str] = inputStructureSplit[i : i + 3]
                if len(currentStrand) < 3:
                    self.parsingResult = False
                    self.errorList.append("Parsing error: Missing Lines")
                    break
                if not any(i in self.validBrackets for i in currentStrand[2]) and all(
                    i in self.validNucleotides for i in currentStrand[2].upper()
                ):  # verify order of lines in a strand by checking checking characters in dotbracket line (doesn't contain any valid brackets and contains only valid nucleotides)
                    self.parsingResult = False
                    self.errorList.append("Parsing error: Wrong line order")
                    break
                else:
                    nucleotides += currentStrand[1]
                    nucleotides += " "

                    dotBracket += currentStrand[2]
                    dotBracket += " "
        else:  # no strand names
            for i in range(0, len(inputStructureSplit), 2):
                currentStrand = inputStructureSplit[i : i + 2]
                if len(currentStrand) < 2:
                    self.parsingResult = False
                    self.errorList.append("Parsing error: Missing Lines")
                    break
                if not any(
                    i in self.validBrackets for i in currentStrand[1]
                ):  # verify order of lines in a strand by checking checking characters in dotbracket line
                    self.parsingResult = False
                    self.errorList.append("Parsing error: Wrong line order")
                    break
                else:
                    nucleotides += currentStrand[0]
                    nucleotides += " "

                    dotBracket += currentStrand[1]
                    dotBracket += " "

        self.parsedStructure: str = (
            nucleotides.strip().upper().replace("T", "U") + "\n" + dotBracket.strip()
        )

    def ValidateRna(
        self,
    ) -> dict:
        """
        Validates rna and returns a fix if needed
        """
        validatedRna: str = ""
        validationResult: bool = False
        fixSuggested: bool = False
        mismatchingBrackets: list[int] = []
        incorrectPairs: list[tuple[int, int]] = []

        if not self.parsingResult:  # check for parsing errors
            validationResult = False
            return {
                "Validation Result": validationResult,
                "Error List": self.errorList,
                "Validated RNA": validatedRna,
                "Mismatching Brackets": mismatchingBrackets,
                "Incorrect Pairs": incorrectPairs,
                "Fix Suggested": fixSuggested,
                "allPairs": [],
            }

        inputStr = self.parsedStructure
        rnaSplit: list[str] = inputStr.split("\n")
        rna: str = rnaSplit[0]
        dotBracket: str = rnaSplit[1]

        # length check
        if len(rna) == 0:
            self.errorList.append("Invalid data")
            validationResult = False
            return {
                "Validation Result": validationResult,
                "Error List": self.errorList,
                "Validated RNA": validatedRna,
                "Mismatching Brackets": mismatchingBrackets,
                "Incorrect Pairs": incorrectPairs,
                "Fix Suggested": fixSuggested,
                "allPairs": [],
            }

        if len(rna.replace(" ", "")) > settings.MAX_RNA_LENGTH:
            self.errorList.append(f"RNA length exceeds maximum allowed length of {settings.MAX_RNA_LENGTH} nucleotides")
            validationResult = False
            return {
                "Validation Result": validationResult,
                "Error List": self.errorList,
                "Validated RNA": validatedRna,
                "Mismatching Brackets": mismatchingBrackets,
                "Incorrect Pairs": incorrectPairs,
                "Fix Suggested": fixSuggested,
                "allPairs": [],
            }
        if len(rna) != len(dotBracket):
            self.errorList.append("RNA and DotBracket not of equal lengths")
            validationResult = False

        # character check
        invalidCharacters: set = set(
            char for char in rna if char not in set(self.validNucleotides)
        )
        if len(invalidCharacters) > 0:
            sortedInvalidCharacters = "".join(sorted(invalidCharacters))
            self.errorList.append(
                f"RNA contains invalid characters: {sortedInvalidCharacters}"
            )
            validationResult = False

        # bracket check
        invalidBrackets: set = set(
            char for char in dotBracket if char not in set(self.validBrackets)
        )
        if len(invalidBrackets) > 0:
            sortedInvalidBrackets = "".join(sorted(invalidBrackets))
            self.errorList.append(
                f"DotBracket contains invalid brackets: {sortedInvalidBrackets}"
            )
            validationResult = False

        # return before stack check if rna invalid
        if len(self.errorList) > 0:
            return {
                "Validation Result": validationResult,
                "Error List": self.errorList,
                "Validated RNA": validatedRna,
                "Mismatching Brackets": mismatchingBrackets,
                "Incorrect Pairs": incorrectPairs,
                "Fix Suggested": fixSuggested,
                "allPairs": [],
            }

        (
            bracketStacks,
            suggestedDotBracketFixList,
            mismatchingBrackets,
            incorrectPairs,
            allPairs,
        ) = self.stackCheck(dotBracket, rna)

        for (
            stack
        ) in bracketStacks.values():  # check stacks for unclosed opening bracket
            for (
                bracket
            ) in stack:  # mismatched opening bracket, suggest replacement to .
                mismatchingBrackets.append(bracket)
                suggestedDotBracketFixList[bracket] = "."
        if "".join(suggestedDotBracketFixList) != dotBracket:
            validationResult = True
            fixSuggested = True
            validatedRna = rna + "\n" + "".join(suggestedDotBracketFixList)
        else:
            validationResult = True
            validatedRna = self.parsedStructure
        return {
            "Validation Result": validationResult,
            "Error List": self.errorList,
            "Validated RNA": validatedRna,
            "Mismatching Brackets": mismatchingBrackets,
            "Incorrect Pairs": incorrectPairs,
            "Fix Suggested": fixSuggested,
            "allPairs": allPairs,
        }

        # stack check

    def stackCheck(self, dotBracket: str, rna: str) -> tuple[
        dict[str, deque[int]],
        list[str],
        list[int],
        list[tuple[int, int]],
        list[tuple[int, int]],
    ]:  # Zmieniono kod aby nie trzeba było powtarzać kodu z liczeniem stacku i par
        bracketStacks: dict[str, deque[int]] = {
            self.validBrackets[i : i + 2]: deque()
            for i in range(0, len(self.validBrackets), 2)
            if self.validBrackets[i] != "."
        }
        allPairs: list[tuple[int, int]] = []
        mismatchingBrackets: list[int] = []
        incorrectPairs: list[tuple[int, int]] = []
        openingLookup: dict[str, str] = {pair[0]: pair for pair in bracketStacks.keys()}
        closingLookup: dict[str, str] = {pair[1]: pair for pair in bracketStacks.keys()}
        suggestedDotBracketFixList: list[str] = list(dotBracket)
        for i in range(len(dotBracket)):
            if dotBracket[i] in openingLookup:  # opening brackets
                bracketStacks[openingLookup[dotBracket[i]]].append(i)
            elif dotBracket[i] in closingLookup:  # closing brackets
                if (
                    len(bracketStacks[closingLookup[dotBracket[i]]]) > 0
                ):  # check if a matching bracket exists
                    index = bracketStacks[closingLookup[dotBracket[i]]][-1]
                    if (
                        rna[bracketStacks[closingLookup[dotBracket[i]]][-1]] + rna[i]
                        in self.validPairs
                    ):  # check if the nucleotide pair is correct
                        allPairs.append((index, i))
                        bracketStacks[closingLookup[dotBracket[i]]].pop()
                    else:  # incorrect nucleotide pair, suggest replacement to .
                        incorrectPairs.append(
                            (bracketStacks[closingLookup[dotBracket[i]]][-1], i)
                        )
                        suggestedDotBracketFixList[i] = "."
                        suggestedDotBracketFixList[
                            bracketStacks[closingLookup[dotBracket[i]]][-1]
                        ] = "."
                        bracketStacks[closingLookup[dotBracket[i]]].pop()
                else:  # mismatched closing bracket, suggest replacement to .
                    mismatchingBrackets.append(i)
                    suggestedDotBracketFixList[i] = "."
        return (
            bracketStacks,
            suggestedDotBracketFixList,
            mismatchingBrackets,
            incorrectPairs,
            allPairs,
        )
