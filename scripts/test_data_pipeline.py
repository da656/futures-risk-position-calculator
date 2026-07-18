from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NPM = shutil.which('npm.cmd') or shutil.which('npm')


def run_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        capture_output=True,
        encoding='utf-8',
        errors='replace',
        check=False,
    )


class DataPipelineTest(unittest.TestCase):
    def test_fixed_contract_check_executes_json_schema_validation(self) -> None:
        completed = run_command([sys.executable, 'scripts/build_china_futures_contracts.py', '--check'])
        self.assertEqual(completed.returncode, 0, completed.stderr)


    def test_business_validation_rejects_future_dates_and_invalid_product_type(self) -> None:
        spec = importlib.util.spec_from_file_location('contracts_builder', ROOT / 'scripts' / 'build_china_futures_contracts.py')
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        record = json.loads((ROOT / 'outputs' / 'cffex-futures.json').read_text(encoding='utf-8'))[0]
        invalid_type = {**record, 'productType': 'unsupported'}
        with self.assertRaises(module.ValidationError):
            module.validate_record(invalid_type, 'CFFEX', set())
        future_date = {**record, 'verifiedAt': '2999-01-01'}
        with self.assertRaises(module.ValidationError):
            module.validate_record(future_date, 'CFFEX', set())
        future_source_date = {**record, 'sourcePublishedAt': '2999-01-01'}
        with self.assertRaises(module.ValidationError):
            module.validate_record(future_source_date, 'CFFEX', set())

    def test_public_dynamic_fee_artifacts_validate_without_excel_snapshot(self) -> None:
        spec = importlib.util.spec_from_file_location('pipeline_check', ROOT / 'scripts' / 'check_data_pipeline.py')
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.validate_public_dynamic_fee_artifacts()

    def test_update_then_check_all_keeps_all_generated_data_consistent(self) -> None:
        self.assertIsNotNone(NPM, '未找到 npm 命令')
        assert NPM is not None
        update = run_command([NPM, 'run', 'data:update'])
        self.assertEqual(update.returncode, 0, update.stderr)
        check = run_command([NPM, 'run', 'data:check-all'])
        self.assertEqual(check.returncode, 0, check.stderr)
        report = (ROOT / 'outputs' / 'fee-margin-coverage-report.md').read_text(encoding='utf-8')
        self.assertIn('已自动带入：**', report)
        self.assertIn('未解决动态费用项（unresolved-fee-margins）', report)
        contracts = json.loads((ROOT / 'outputs' / 'china-futures-contracts.json').read_text(encoding='utf-8'))
        fees = json.loads((ROOT / 'outputs' / 'exchange-fee-margin.json').read_text(encoding='utf-8'))
        self.assertIn(f'{len(fees)}/{len(contracts)}', report)
        generated_keys = {(row['exchange'], row['symbol']) for row in fees}
        self.assertTrue({('DCE', 'V'), ('DCE', 'L'), ('DCE', 'PP'), ('CFFEX', 'T')}.isdisjoint(generated_keys))
        contracts_report = (ROOT / 'outputs' / 'data-quality-report.md').read_text(encoding='utf-8')
        self.assertIn('固定参数未解决项（unresolved-contracts）', contracts_report)
        self.assertTrue((ROOT / 'outputs' / 'unresolved-contracts.csv').exists())
        self.assertTrue((ROOT / 'outputs' / 'unresolved-fee-margins.csv').exists())

        target = ROOT / 'src' / 'data' / 'officialContracts.ts'
        original = target.read_text(encoding='utf-8')
        try:
            target.write_text(original + '\n// stale generated artifact\n', encoding='utf-8')
            stale_check = run_command([NPM, 'run', 'data:check-all'])
            self.assertNotEqual(stale_check.returncode, 0)
        finally:
            target.write_text(original, encoding='utf-8')


if __name__ == '__main__':
    unittest.main()
