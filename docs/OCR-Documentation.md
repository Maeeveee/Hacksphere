# OCR Identity Document Scanner

This feature allows users to automatically extract and fill passenger data from Indonesian identity documents (KTP) using Optical Character Recognition (OCR).

## Features

- **Dual Input Method**: Supports both camera capture and file upload
- **Automatic Data Extraction**: Recognizes name and NIK from Indonesian KTP
- **Auto-Fill**: Automatically populates form fields with extracted data
- **Real-time Processing**: Uses Tesseract.js for client-side OCR
- **User-Friendly Interface**: Clean modal interface with helpful tips

## How to Use

### For Booking Data (Main Booker)
1. Click the "Scan ID" button in the Data Pemesanan section
2. Choose between "Ambil Foto" (camera) or "Upload File"
3. Position the KTP clearly in frame or select a clear image file
4. Wait for processing (a few seconds)
5. The extracted data will automatically fill the form fields

### For Passenger Data
1. Each passenger form has its own "Scan ID" button
2. The button is disabled for the first passenger if "auto-fill from booker" is checked
3. Follow the same process as booking data
4. Data will be filled for that specific passenger

## Tips for Best Results

- **Good Lighting**: Ensure adequate lighting when taking photos
- **Clear Image**: Document should be in focus and not blurry
- **No Shadows**: Avoid shadows on the document
- **Horizontal Position**: Position the KTP horizontally
- **Clean Background**: Use a plain background when possible
- **High Resolution**: Use high-quality images for better recognition

## Supported Document Types

Currently supports:
- Indonesian KTP (Kartu Tanda Penduduk)
- Extracts: Name (Nama) and NIK (16-digit number)

## Technical Implementation

### Dependencies
- `tesseract.js`: OCR engine
- `React`: Component framework
- Camera API: For real-time capture

### Data Extraction
The OCR parser looks for:
- **NIK**: 16-digit number patterns
- **Name**: Text patterns following Indonesian ID card structure
- **Document Type**: Automatically detects as NIK for Indonesian KTP

### Error Handling
- Validates extracted data before auto-filling
- Shows helpful error messages
- Allows manual correction if OCR fails
- Graceful camera permission handling

## Usage Example

```tsx
<OCRScanner
  passengerIndex={0}
  onDataExtracted={(data) => handleOCRDataExtracted(0, data)}
/>
```

## Browser Compatibility

- **Camera**: Requires HTTPS for camera access
- **File Upload**: Works on all modern browsers
- **OCR Processing**: Works offline (client-side processing)

## Performance Notes

- OCR processing takes 3-10 seconds depending on image quality
- Processing happens entirely in the browser (no server calls)
- Memory usage is optimized for mobile devices
- Camera stream is properly cleaned up after use

## Future Enhancements

- Support for other ID document types
- Multi-language support
- Improved name parsing algorithms
- Batch processing for multiple passengers
- Document validation features