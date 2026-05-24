const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
  let contract;
  let owner, issuer, nonIssuer, student;

  beforeEach(async function () {
    [owner, issuer, nonIssuer, student] = await ethers.getSigners();
    
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    contract = await CertificateNFT.deploy();
    await contract.waitForDeployment();
  });

  // Helper: Generate bytes32 dari string
  const toBytes32 = (str) => {
    return ethers.encodeBytes32String(str);
  };

  describe("Deployment", function () {
    it("Should set owner correctly", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Owner should be issuer by default", async function () {
      expect(await contract.isIssuer(owner.address)).to.be.true;
    });
  });

  describe("Issuer Management", function () {
    it("Owner can add issuer", async function () {
      await contract.addIssuer(issuer.address);
      expect(await contract.isIssuer(issuer.address)).to.be.true;
    });

    it("Non-owner cannot add issuer", async function () {
      // nonIssuer bukan owner, jadi harus direvert
      await expect(
        contract.connect(nonIssuer).addIssuer(issuer.address)
      ).to.be.revertedWith("CertificateNFT: Hanya owner yang bisa");
    });

    it("Owner can remove issuer", async function () {
      await contract.addIssuer(issuer.address);
      await contract.removeIssuer(issuer.address);
      expect(await contract.isIssuer(issuer.address)).to.be.false;
    });

    it("Cannot remove owner as issuer", async function () {
      await expect(
        contract.removeIssuer(owner.address)
      ).to.be.revertedWith("CertificateNFT: Tidak bisa menghapus owner");
    });
  });

  describe("Certificate Management", function () {
    // Gunakan ID yang unik untuk setiap test
    const certId1 = "CERT-001";
    const certId2 = "CERT-002";
    let certIdBytes1, certIdBytes2;

    beforeEach(function () {
      certIdBytes1 = toBytes32(certId1);
      certIdBytes2 = toBytes32(certId2);
    });

    it("Issuer can issue certificate", async function () {
      await contract.issueCertificate(
        certIdBytes1,
        "Budi Santoso",
        "Teknik Informatika",
        "QmTest12345678901234567890"
      );
      
      const cert = await contract.getCertificate(certIdBytes1);
      expect(cert.studentName).to.equal("Budi Santoso");
      expect(cert.isValid).to.be.true;
      expect(cert.issuer).to.equal(owner.address);
    });

    it("Non-issuer cannot issue certificate", async function () {
      // Pastikan nonIssuer bukan issuer
      expect(await contract.isIssuer(nonIssuer.address)).to.be.false;
      
      await expect(
        contract.connect(nonIssuer).issueCertificate(
          certIdBytes1,
          "Budi",
          "TI",
          "QmTest12345678901234567890"
        )
      ).to.be.revertedWith("CertificateNFT: Hanya issuer terdaftar yang bisa");
    });

    it("Cannot issue duplicate certificate ID", async function () {
      // Issue pertama
      await contract.issueCertificate(
        certIdBytes1,
        "Budi",
        "TI",
        "QmTest12345678901234567890"
      );
      
      // Issue kedua dengan ID sama → harus error
      await expect(
        contract.issueCertificate(
          certIdBytes1,
          "Budi 2",
          "TI 2",
          "QmTest09876543210987654321"
        )
      ).to.be.revertedWith("CertificateNFT: Sertifikat sudah ada");
    });

    it("Issuer can revoke their own certificate", async function () {
      // Issue dulu
      await contract.issueCertificate(
        certIdBytes1,
        "Budi",
        "TI",
        "QmTest12345678901234567890"
      );
      
      // Revoke
      await contract.revokeCertificate(certIdBytes1);
      
      // Cek status
      const cert = await contract.getCertificate(certIdBytes1);
      expect(cert.isValid).to.be.false;
    });

    it("Cannot revoke already revoked certificate", async function () {
      await contract.issueCertificate(
        certIdBytes1,
        "Budi",
        "TI",
        "QmTest12345678901234567890"
      );
      
      // Revoke pertama
      await contract.revokeCertificate(certIdBytes1);
      
      // Revoke kedua → harus error
      await expect(
        contract.revokeCertificate(certIdBytes1)
      ).to.be.revertedWith("CertificateNFT: Sertifikat sudah direvoke");
    });
  });

  describe("Verification", function () {
    const certId = "CERT-VERIFY-001";
    let certIdBytes;

    beforeEach(async function () {
      certIdBytes = toBytes32(certId);
      // Issue certificate untuk test verify
      await contract.issueCertificate(
        certIdBytes,
        "Budi Verify",
        "Teknik Sipil",
        "QmTestVerify1234567890123456"
      );
    });

    it("Anyone can verify (free)", async function () {
      // nonIssuer yang tidak punya role khusus bisa verify
      const result = await contract.connect(nonIssuer).verifyCertificate(certIdBytes);
      expect(result.isValid).to.be.true;
      expect(result.studentName).to.equal("Budi Verify");
      expect(result.courseName).to.equal("Teknik Sipil");
      expect(result.issuer).to.equal(owner.address);
    });

    it("Returns not found for non-existent certificate", async function () {
      const fakeId = toBytes32("FAKE-NOT-EXIST");
      await expect(
        contract.verifyCertificate(fakeId)
      ).to.be.revertedWith("CertificateNFT: Sertifikat tidak ditemukan");
    });

    it("Verify returns correct data after revoke", async function () {
      // Revoke dulu
      await contract.revokeCertificate(certIdBytes);
      
      // Verify setelah revoke
      const result = await contract.verifyCertificate(certIdBytes);
      expect(result.isValid).to.be.false;
      expect(result.studentName).to.equal("Budi Verify");
    });
  });

  describe("Helper Functions", function () {
    it("Should return correct total certificates", async function () {
      expect(await contract.getTotalCertificates()).to.equal(0);
      
      await contract.issueCertificate(
        toBytes32("CERT-A"),
        "A",
        "Course A",
        "QmA1234567890123456789012"
      );
      
      expect(await contract.getTotalCertificates()).to.equal(1);
      
      await contract.issueCertificate(
        toBytes32("CERT-B"),
        "B",
        "Course B",
        "QmB1234567890123456789012"
      );
      
      expect(await contract.getTotalCertificates()).to.equal(2);
    });

    it("certificateExists should work correctly", async function () {
      const certId = toBytes32("CERT-EXIST");
      
      expect(await contract.certificateExists(certId)).to.be.false;
      
      await contract.issueCertificate(
        certId,
        "Test",
        "Course",
        "QmExist12345678901234567890"
      );
      
      expect(await contract.certificateExists(certId)).to.be.true;
    });
  });
});