const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Readable } = require("stream");

const asyncHandler = require("express-async-handler");
const CustomNotFoundError = require("../errors/CustomNotFoundError");

const supabase = require("../config/supabaseClient");

module.exports.createFile = asyncHandler(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.params);
  if (!req.user) {
    throw new Error("Unauthorized.");
  }
  if (!req.file) {
    throw new Error("No file selected.");
  }

  // Upload file to Supabase
  const { data, error } = await supabase.storage
    .from("FileUploader")
    .upload(
      `uploads/${req.user.username}/${req.params.directoryId}/${req.file.originalname}`,
      req.file.buffer,
      {
        contentType: req.file.mimetype,
        upsert: true,
      }
    );

  if (error) throw error;

  const fileWithSameName = await prisma.file.findFirst({
    where: {
      name: req.file.originalname,
    },
  });

  if (fileWithSameName) {
    await prisma.file.update({
      where: {
        id: fileWithSameName.id,
      },
      data: {
        name: req.file.originalname,
        size: req.file.size.toString(),
        type: req.file.mimetype,
        // path: `/${req.user.username}/${req.params.directoryId}/${req.file.originalname}`,
        path: data.path,
        directoryId: parseInt(req.params.directoryId),
        ownerId: req.user.id,
      },
    });
  } else {
    await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size.toString(),
        type: req.file.mimetype,
        // path: `/${req.user.username}/${req.params.directoryId}/${req.file.originalname}`,
        path: data.path,
        directoryId: parseInt(req.params.directoryId),
        ownerId: req.user.id,
      },
    });
  }

  // res.redirect(`/directory/${parseInt(req.params.directoryId)}`);
  res.redirect(req.get("referer"));
});

module.exports.getFileInfo = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  }

  res.render("file-info", {
    file,
    currentUser: req.user,
  });
});

module.exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  } else {
    // Delete file from supabase
    const { data, error } = await supabase.storage
      .from("FileUploader")
      .remove([`${file.path}`]);

    await prisma.file.delete({
      where: {
        id: parseInt(req.params.fileId),
        ownerId: req.user.id,
      },
    });
  }

  // res.send(JSON.stringify(file.directoryId));
  res.redirect(`/directory/${file.directoryId}`);
});

module.exports.downloadFile = asyncHandler(async (req, res) => {
  const file = await prisma.file.findUnique({
    where: {
      id: parseInt(req.params.fileId),
      ownerId: req.user.id,
    },
  });

  if (!file) {
    throw new CustomNotFoundError("File does not exist");
  }

  const { data, error } = await supabase.storage
    .from("FileUploader")
    .createSignedUrl(file.path, 60);

  if (error) {
    return res.status(500).json({ error: "Error generating file URL" });
  }

  // Fetch the file from Supabase Storage
  const response = await fetch(data.signedUrl);

  if (!response.ok) {
    return res.status(500).json({ error: "Failed to fetch file" });
  }

  // Convert response to Buffer
  const fileBuffer = await response.arrayBuffer();

  // Set response headers for file download
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${file.path.split("/").pop()}"`
  );
  res.setHeader("Content-Type", response.headers.get("content-type"));

  // Stream the file to the response using Readable.from()
  Readable.from(Buffer.from(fileBuffer)).pipe(res);
});
