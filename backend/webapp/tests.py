from django.test import TestCase
from webapp.utils import get_inf_f1, dotbracketToPairs

class UtilsFunctionTests(TestCase):
    def test_get_inf_f1_perfect_match(self):
        target = {(1, 2), (2, 3), (4, 5)}
        model = {(1, 2), (2, 3), (4, 5)}
        inf, f1 = get_inf_f1(target, model)
        self.assertAlmostEqual(inf, 1.0)
        self.assertAlmostEqual(f1, 1.0)

    def test_get_inf_f1_partial_match(self):
        target = {(1, 2), (3, 4), (5, 6)}
        model = {(1, 2), (3, 4), (7, 8)}
        inf, f1 = get_inf_f1(target, model)
        self.assertLess(inf, 1.0)
        self.assertLess(f1, 1.0)

    def test_dotbracketToPairs_valid_input(self):
        fasta_input = ">tsh_helix\nCGCGGAACG CGGGACGCG\n((((...(( ))...))))"
        status, messages, corrected, pairs = dotbracketToPairs(fasta_input)
        self.assertEqual(status, "OK")
        self.assertEqual(messages, [])
        self.assertEqual(corrected, "")
        expected_pairs = {(9, 10), (1, 18), (2, 17), (3, 16), (4, 15), (8, 11)}
        self.assertSetEqual(pairs, expected_pairs)

    def test_dotbracketToPairs_mismatched_length(self):
        fasta_input = "#testLen\n>seq1\nGCGCGCGC\n((......))"
        status, messages, corrected, pairs = dotbracketToPairs(fasta_input)
        self.assertEqual(status, "ERROR")
        self.assertTrue(any("length not equal" in msg for msg in messages))
        self.assertEqual(corrected, "")
        self.assertEqual(pairs, set())

    def test_dotbracketToPairs_illegal_nucleotide(self):
        fasta_input = ">strandC\nGCGXAU\n......"
        status, messages, corrected, pairs = dotbracketToPairs(fasta_input)
        self.assertEqual(status, "ERROR")
        self.assertTrue(any("not valid" in msg for msg in messages))

    def test_dotbracketToPairs_illegal_bracket(self):
        fasta_input = ">strandD\nGCGGAU\n((..~."
        status, messages, corrected, pairs = dotbracketToPairs(fasta_input)
        self.assertEqual(status, "ERROR")
        self.assertTrue(any("Bracket on" in msg for msg in messages))

    def test_dotbracketToPairs_warning_invalid_pair(self):
        fasta_input = ">seq1\nCCCC\n.()."
        status, messages, corrected, pairs = dotbracketToPairs(fasta_input)
        self.assertEqual(status, "WARNING")
        self.assertTrue(any("not valid connections" in msg for msg in messages))
        self.assertEqual(len(corrected), 4)
