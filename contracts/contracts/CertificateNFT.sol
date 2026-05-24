// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateNFT
 * @notice Smart contract untuk penerbitan dan verifikasi sertifikat/ijazah digital
 * @dev Menggunakan sistem role-based access control sederhana
 */
contract CertificateNFT {
    
    // ============ STATE VARIABLES ============
    
    /// @notice Pemilik kontrak (admin utama)
    address public owner;
    
    /// @notice Mapping untuk melacak address yang diizinkan menerbitkan sertifikat
    mapping(address => bool) public isIssuer;
    
    /// @notice Counter untuk jumlah sertifikat
    uint256 private _certificateCounter;
    
    /**
     * @dev Struktur data untuk menyimpan informasi sertifikat
     */
    struct Certificate {
        string studentName;
        string courseName;
        string ipfsCID;
        uint256 issueDate;
        bool isValid;
        address issuer;
    }
    
    /// @notice Mapping dari certificate ID ke data Certificate
    mapping(bytes32 => Certificate) private certificates;
    
    /// @notice Array untuk menyimpan semua certificate IDs
    bytes32[] private certificateIds;
    
    // ============ EVENTS ============
    
    /// @notice Emit saat sertifikat baru diterbitkan
    event CertificateIssued(
        bytes32 indexed certId,
        string studentName,
        address indexed issuer,
        uint256 timestamp
    );
    
    /// @notice Emit saat sertifikat dicabut
    event CertificateRevoked(
        bytes32 indexed certId,
        address indexed issuer,
        uint256 timestamp
    );
    
    /// @notice Emit saat issuer baru ditambahkan
    event IssuerAdded(
        address indexed issuer,
        address indexed addedBy
    );
    
    /// @notice Emit saat issuer dihapus
    event IssuerRemoved(
        address indexed issuer,
        address indexed removedBy
    );
    
    // ============ MODIFIERS ============
    
    /// @notice Memastikan hanya owner yang bisa memanggil
    modifier onlyOwner() {
        require(msg.sender == owner, "CertificateNFT: Hanya owner yang bisa");
        _;
    }
    
    /// @notice Memastikan hanya issuer terdaftar yang bisa memanggil
    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "CertificateNFT: Hanya issuer terdaftar yang bisa");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        isIssuer[msg.sender] = true;
        _certificateCounter = 0;
    }
    
    // ============ ISSUER MANAGEMENT ============
    
    /**
     * @notice Menambahkan address sebagai issuer baru
     * @dev Hanya bisa dipanggil oleh owner
     * @param _newIssuer Address yang akan dijadikan issuer
     */
    function addIssuer(address _newIssuer) external onlyOwner {
        require(_newIssuer != address(0), "CertificateNFT: Address tidak valid");
        require(!isIssuer[_newIssuer], "CertificateNFT: Address sudah menjadi issuer");
        
        isIssuer[_newIssuer] = true;
        emit IssuerAdded(_newIssuer, msg.sender);
    }
    
    /**
     * @notice Menghapus issuer dari daftar
     * @dev Hanya bisa dipanggil oleh owner
     * @param _issuer Address yang akan dihapus dari daftar issuer
     */
    function removeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "CertificateNFT: Address tidak valid");
        require(isIssuer[_issuer], "CertificateNFT: Address bukan issuer");
        require(_issuer != owner, "CertificateNFT: Tidak bisa menghapus owner");
        
        isIssuer[_issuer] = false;
        emit IssuerRemoved(_issuer, msg.sender);
    }
    
    // ============ CERTIFICATE MANAGEMENT ============
    
    /**
     * @notice Menerbitkan sertifikat baru
     * @dev Hanya bisa dipanggil oleh issuer terdaftar
     * @param certId ID unik sertifikat
     * @param _studentName Nama mahasiswa
     * @param _courseName Nama program studi
     * @param _ipfsCID CID file PDF di IPFS
     */
    function issueCertificate(
        bytes32 certId,
        string memory _studentName,
        string memory _courseName,
        string memory _ipfsCID
    ) external onlyIssuer {
        require(bytes(_studentName).length > 0, "CertificateNFT: Nama mahasiswa harus diisi");
        require(bytes(_courseName).length > 0, "CertificateNFT: Nama program harus diisi");
        require(bytes(_ipfsCID).length > 0, "CertificateNFT: IPFS CID harus diisi");
        require(certificates[certId].issueDate == 0, "CertificateNFT: Sertifikat sudah ada");
        
        certificates[certId] = Certificate({
            studentName: _studentName,
            courseName: _courseName,
            ipfsCID: _ipfsCID,
            issueDate: block.timestamp,
            isValid: true,
            issuer: msg.sender
        });
        
        certificateIds.push(certId);
        _certificateCounter++;
        
        emit CertificateIssued(certId, _studentName, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Mencabut/merevoke sertifikat
     * @dev Hanya issuer yang menerbitkan sertifikat yang bisa merevoke
     * @param certId ID sertifikat yang akan direvoke
     */
    function revokeCertificate(bytes32 certId) external onlyIssuer {
        Certificate storage cert = certificates[certId];
        
        require(cert.issueDate != 0, "CertificateNFT: Sertifikat tidak ditemukan");
        require(cert.isValid, "CertificateNFT: Sertifikat sudah direvoke");
        require(cert.issuer == msg.sender, "CertificateNFT: Hanya issuer asli yang bisa merevoke");
        
        cert.isValid = false;
        emit CertificateRevoked(certId, msg.sender, block.timestamp);
    }
    
    // ============ VERIFICATION (PUBLIC - FREE) ============
    
    /**
     * @notice Memverifikasi keaslian sertifikat (GRATIS - view function)
     * @dev Siapa pun bisa memanggil tanpa gas fee
     * @param certId ID sertifikat yang akan diverifikasi
     * @return isValid Status keabsahan sertifikat
     * @return studentName Nama mahasiswa
     * @return courseName Nama program studi
     * @return issueDate Tanggal penerbitan
     * @return issuer Address penerbit
     */
    function verifyCertificate(bytes32 certId) 
        external 
        view 
        returns (
            bool isValid,
            string memory studentName,
            string memory courseName,
            uint256 issueDate,
            address issuer
        ) 
    {
        Certificate storage cert = certificates[certId];
        require(cert.issueDate != 0, "CertificateNFT: Sertifikat tidak ditemukan");
        
        return (
            cert.isValid,
            cert.studentName,
            cert.courseName,
            cert.issueDate,
            cert.issuer
        );
    }
    
    /**
     * @notice Mendapatkan detail lengkap sertifikat (GRATIS - view function)
     * @dev Siapa pun bisa memanggil tanpa gas fee
     * @param certId ID sertifikat
     * @return studentName Nama mahasiswa
     * @return courseName Nama program studi
     * @return ipfsCID Content Identifier di IPFS
     * @return issueDate Tanggal penerbitan
     * @return isValid Status keabsahan
     * @return issuer Address penerbit
     */
    function getCertificate(bytes32 certId)
        external
        view
        returns (
            string memory studentName,
            string memory courseName,
            string memory ipfsCID,
            uint256 issueDate,
            bool isValid,
            address issuer
        )
    {
        Certificate storage cert = certificates[certId];
        require(cert.issueDate != 0, "CertificateNFT: Sertifikat tidak ditemukan");
        
        return (
            cert.studentName,
            cert.courseName,
            cert.ipfsCID,
            cert.issueDate,
            cert.isValid,
            cert.issuer
        );
    }
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @notice Mendapatkan total sertifikat yang pernah diterbitkan
     * @return Jumlah total sertifikat
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateCounter;
    }
    
    /**
     * @notice Mendapatkan semua certificate IDs
     * @return Array of certificate IDs
     */
    function getAllCertificateIds() external view returns (bytes32[] memory) {
        return certificateIds;
    }
    
    /**
     * @notice Cek apakah sebuah sertifikat ada
     * @param certId ID sertifikat
     * @return exists True jika sertifikat ada
     */
    function certificateExists(bytes32 certId) external view returns (bool) {
        return certificates[certId].issueDate != 0;
    }
}