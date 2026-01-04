import unittest
from src.math_utils import dist

class TestMath(unittest.TestCase):
    def test_dist(self):
        self.assertAlmostEqual(dist(0, 0, 3, 4), 5.0)

if __name__ == "__main__":
    unittest.main()
