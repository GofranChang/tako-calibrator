# Tako EC Calibration

[简体中文](README.md) | **English**

A local Web Serial calibration tool for the analog-matrix firmware in the adjacent `tako-config` repository. The interface supports Chinese and English. There are no npm dependencies, no data uploads, and no automatic Flash writes.

## Run locally

In WSL:

```bash
cd /home/gofran/workspace/tako-calibrator
python3 serve.py
```

Open **http://localhost:8080** in **Windows desktop Chrome or Edge**. The Windows browser accesses the keyboard's serial port directly; USB forwarding to WSL is unnecessary. For a different port, run `python3 serve.py --port 8081` and open the matching URL. Press Ctrl+C to stop the server. It listens only on `127.0.0.1`.

Use the language selector in the header to switch between Chinese and English. Your choice is stored locally when browser storage is available. Switching languages preserves the serial connection, calibration progress, and captured data. Raw serial transcripts and backup formats are not translated.

## Calibrate a keyboard half

1. Connect one half directly over USB and select Left half or Right half in the page. Close other applications using its serial port.
2. Click Connect serial port and choose the calibration port. The left half exposes separate Studio and calibration CDC ports. Disconnect and choose again if you selected the wrong port. The page sends `ec` to check the shell.
3. Optionally read current data and download a backup first. Release every key, then start calibration.
4. Wait for released-value sampling to finish. Fully press one key at a time for **at least 1 second**, until it turns green, then release. The driver waits about 200 ms before capturing the pressed samples. Releasing too early can produce invalid data.
5. All 17 keys must have valid readings before saving. Orange keys have invalid data; complete the run and repeat calibration. The page checks that pressed values exceed released values by at least 128 and that known noise is below the captured range.
6. Click Save to keyboard. The firmware does not provide an explicit successful-write acknowledgment, so the page reports only that the command was sent. Read and download a backup, physically reset the keyboard, reconnect, and read again. Compare both arrays and test typing to verify persistence and operation.
7. Disconnect, select the other half, and repeat. Each half's data is kept separately in the current page. **Reloading loses in-page data**, so download backups first.

Demo mode works without a keyboard. Its downloads are marked as simulated. Exiting demo clears simulated state.

## Inspect raw readings

Before calibration, select any valid key and click Sample 20 readings. The firmware returns one reading per second; the page waits up to 30 seconds. Compare released and fully pressed values during the sampling window. Minimum, maximum, and average values are shown, and each reading is kept in the serial log.

During calibration, the driver is busy. To interrupt a stuck run before independent sampling, press the keyboard's physical reset button and reconnect.

## Files and checks

- `dist/`: static HTML, CSS and JavaScript. Can be served on localhost or HTTPS; real connections require desktop Web Serial support.
- `dist/protocol.js`: serial chunk handling, ANSI stripping, log/DTS parsing and calibration quality checks.
- `dist/i18n.js`: UI translations, language persistence and dynamic text updates. Serial transcripts are excluded from translation.
- `tests/`: run `npm test` or `node --test tests/*.test.mjs`. No dependency installation is needed.
- `serve.py`: static server using the Python standard library.
- `reference/`: public upstream source references with their original license notices. The application does not execute these C files.

## Protocol and limitations

Verified against `petejohanson/analog-matrix-module` commit `a2c73edfcee7d7e626d323982b14dcd1e2b88332`.

Commands: `ec KSCAN calibration start/save/load/export` and `ec KSCAN sample ROW COLUMN 20`. Per-key logs use **`(COLUMN,ROW)`**, while exported arrays use index **`ROW*5+COLUMN`**. Each array has 20 entries; columns 2, 3 and 4 of the final row are unused. Right-side main keys are mirrored; left thumb keys follow the matrix transform. Key labels show the compiled QWERTY Base layout and do not automatically track Studio remapping.

Calibration logs provide released/pressed values, noise and SNR. Exports contain only released/pressed values, so unavailable noise and SNR are shown as a dash.

The firmware has no cancel command. Disconnecting the browser does not cancel calibration; use physical reset. Load also has no explicit success acknowledgment: if Flash contains no data, RAM values may remain unchanged. Matching values immediately after Load do not prove persistence; reset and read again.

DTS and JSON downloads are backups. The current firmware has no serial import interface, so this tool does not restore backups or change trigger thresholds online. `flashWriteVerified: false` in JSON is a fixed metadata field, not proof of failure; verify by comparing a post-reset read with the backup.

Sources: [upstream calibration shell](https://github.com/petejohanson/analog-matrix-module/blob/a2c73edfcee7d7e626d323982b14dcd1e2b88332/drivers/kscan/analog_matrix_shell.c), [Chrome Web Serial documentation](https://developer.chrome.com/docs/capabilities/serial).
