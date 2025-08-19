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

        """
        for debugging purpose
        self.validBrackets: str = "()<>[]{}AaBbCcDd." + " "
        self.validNucleotides: str = "AUGC" + " "
        self.validPairs: list[str] = ["GC", "CG", "AU", "UA", "GU", "UG"]"""

        self.FastaFileParse()

    def FastaFileParse(self) -> None:
        """
        Converts strands to uppercase, replaces T with U, and joins them with spaces
        """
        inputStructureSplit: list[str] = [
            item for item in self.fasta_raw.split("\n") if item != ""
        ]  # remove empty lines
        nucleotides: str = ""
        dotBracket: str = ""
        for i in range(len(inputStructureSplit)):
            try:
                if inputStructureSplit[i][0] == ">":
                    nucleotides += inputStructureSplit[i + 1]
                    nucleotides += " "

                    dotBracket += inputStructureSplit[i + 2]
                    dotBracket += " "
            except Exception:
                pass
        self.parsedStructure: str = (
            nucleotides.strip().upper().replace("T", "U") + "\n" + dotBracket.strip()
        )

    def ValidateRna(
        self,
    ) -> dict:
        """
        Validates rna and returns a fix if needed
        """
        inputStr = self.parsedStructure
        rnaSplit: list[str] = inputStr.split("\n")
        rna: str = rnaSplit[0]
        dotBracket: str = rnaSplit[1]

        errorList: list[str] = []
        validatedRna: str = ""
        validationResult: bool = False
        fixSuggested: bool = False

        # length check
        if len(rna) == 0:
            errorList.append("Invalid data")
            validationResult = False
            return {"Validation Result": validationResult, "Error List": errorList}
        if len(rna) != len(dotBracket):
            errorList.append("RNA and DotBracket not of equal lengths")
            validationResult = False

        # character check
        invalidCharacters: set = set(
            char for char in rna if char not in set(self.validNucleotides)
        )
        if len(invalidCharacters) > 0:
            sortedInvalidCharacters = "".join(sorted(invalidCharacters))
            errorList.append(
                f"RNA contains invalid characters: {sortedInvalidCharacters}"
            )
            validationResult = False

        # bracket check
        invalidBrackets: set = set(
            char for char in dotBracket if char not in set(self.validBrackets)
        )
        if len(invalidBrackets) > 0:
            sortedInvalidBrackets = "".join(sorted(invalidBrackets))
            errorList.append(
                f"DotBracket contains invalid brackets: {sortedInvalidBrackets}"
            )
            validationResult = False

        # return before stack check if rna invalid
        if len(errorList) > 0:
            return {"Validation Result": validationResult, "Error List": errorList}

        # stack check
        bracketStacks: dict[str, deque[int]] = {
            self.validBrackets[i : i + 2]: deque()
            for i in range(0, len(self.validBrackets), 2)
            if self.validBrackets[i] != "."
        }
        openingLookup: dict[str, str] = {pair[0]: pair for pair in bracketStacks.keys()}
        closingLookup: dict[str, str] = {pair[1]: pair for pair in bracketStacks.keys()}
        mismatchingBrackets: list[int] = []
        incorrectPairs: list[tuple[int, int]] = []
        suggestedDotBracketFixList: list[str] = list(dotBracket)
        for i in range(len(dotBracket)):
            if dotBracket[i] in openingLookup:  # opening brackets
                bracketStacks[openingLookup[dotBracket[i]]].append(i)
            elif dotBracket[i] in closingLookup:  # closing brackets
                if (
                    len(bracketStacks[closingLookup[dotBracket[i]]]) > 0
                ):  # check if a matching bracket exists
                    if (
                        rna[bracketStacks[closingLookup[dotBracket[i]]][-1]] + rna[i]
                        in self.validPairs
                    ):  # check if the nucleotide pair is correct
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
            "Error List": errorList,
            "Validated RNA": validatedRna,
            "Mismatching Brackets": mismatchingBrackets,
            "Incorrect Pairs": incorrectPairs,
            "Fix Suggested": fixSuggested,
        }
