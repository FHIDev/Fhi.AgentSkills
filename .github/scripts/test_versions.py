import unittest
from check_versions import check, version


class VersionTests(unittest.TestCase):
    def test_changed_package_needs_increase(self):
        for new in ('1.2.0', '1.1.9'):
            with self.assertRaises(ValueError):
                check('1.2.0', new, True)

    def test_valid_release(self):
        check('1.9.0', '1.10.0', True)
        check('1.0.0', '1.0.1', True)

    def test_metadata_only(self):
        check('1.0.0', '1.0.0', False)

    def test_initial_migration(self):
        check(None, '1.0.0', True)
        with self.assertRaises(ValueError):
            check(None, '0.1.0', True)

    def test_invalid_versions(self):
        for value in ('01.0.0', '1.0', '1.0.0-beta', 'a.b.c'):
            with self.assertRaises(ValueError):
                version(value)


if __name__ == '__main__':
    unittest.main()
