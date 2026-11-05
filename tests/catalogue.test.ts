import { describe, expect, it } from "vitest";
import { buildDesigns, mapRecordToDesign } from "../src/catalogue";

const completeRecord = {
  systemNumber: "O176602",
  objectType: "Wallpaper",
  _primaryTitle: "Wallpaper",
  _primaryMaker: { name: "Morris & Co.", association: "maker" },
  _primaryImageId: "2008BT5270",
  _primaryDate: "ca.1786",
  _primaryPlace: "England",
};

const recordWithoutImageId = {
  systemNumber: "O176602",
  objectType: "Wallpaper",
  _primaryTitle: "Wallpaper",
  _primaryMaker: { name: "Morris & Co.", association: "maker" },
  _primaryDate: "ca.1786",
  _primaryPlace: "England",
};

const recordWithoutDate = {
  systemNumber: "O176602",
  objectType: "Wallpaper",
  _primaryTitle: "Wallpaper",
  _primaryMaker: { name: "Morris & Co.", association: "maker" },
  _primaryImageId: "2008BT5270",
  _primaryPlace: "England",
};

const recordWithoutMaker = {
  systemNumber: "O176602",
  objectType: "Wallpaper",
  _primaryTitle: "Wallpaper",
  _primaryImageId: "2008BT5270",
  _primaryDate: "ca.1786",
  _primaryPlace: "England",
};

const recordWithoutTitle = {
  systemNumber: "O176602",
  objectType: "Wallpaper",
  _primaryMaker: { name: "Morris & Co.", association: "maker" },
  _primaryImageId: "2008BT5270",
  _primaryDate: "ca.1786",
  _primaryPlace: "England",
};

describe("mapping a search record to a design", () => {
  it("maps a complete record into a design", () => {
    expect(mapRecordToDesign(completeRecord)).toEqual({
      id: "O176602",
      title: "Wallpaper",
      maker: "Morris & Co.",
      dateText: "ca.1786",
      year: 1786,
      objectType: "Wallpaper",
      placeOfOrigin: "England",
      imageId: "2008BT5270",
      thumbnailUrl:
        "https://framemark.vam.ac.uk/collections/2008BT5270/full/!400,400/0/default.jpg",
      largeImageUrl:
        "https://framemark.vam.ac.uk/collections/2008BT5270/full/!1200,1200/0/default.jpg",
      recordUrl: "https://collections.vam.ac.uk/item/O176602/",
    });
  });

  it.each([
    { description: "the image id is absent", record: recordWithoutImageId },
    {
      description: "the image id is null",
      record: { ...recordWithoutImageId, _primaryImageId: null },
    },
  ])("maps nothing when $description", ({ record }) => {
    expect(mapRecordToDesign(record)).toBeNull();
  });

  it("maps a record with no date to a design with no year", () => {
    const design = mapRecordToDesign(recordWithoutDate);

    expect(design?.year).toBeNull();
    expect(design?.dateText).toBeNull();
  });

  it.each([
    { description: "the maker is absent", record: recordWithoutMaker },
    {
      description: "the maker is null",
      record: { ...recordWithoutMaker, _primaryMaker: null },
    },
    {
      description: "the maker name is empty",
      record: { ...completeRecord, _primaryMaker: { name: "" } },
    },
  ])("reads the maker as Unknown when $description", ({ record }) => {
    expect(mapRecordToDesign(record)?.maker).toBe("Unknown");
  });

  it("names a design Untitled when the title is absent", () => {
    expect(mapRecordToDesign(recordWithoutTitle)?.title).toBe("Untitled");
  });

  it.each([
    { objectType: "Wall covering" },
    { objectType: "Wall hanging" },
    { objectType: "Printed flannel" },
    { objectType: "Sample" },
  ])("maps nothing when the object type is $objectType", ({ objectType }) => {
    expect(mapRecordToDesign({ ...completeRecord, objectType })).toBeNull();
  });

  it.each([
    { objectType: "Wallpaper sample" },
    { objectType: "Textile design" },
    { objectType: "Furnishing fabric" },
    { objectType: "Furnishing  fabric" },
  ])("maps a record of object type $objectType", ({ objectType }) => {
    expect(mapRecordToDesign({ ...completeRecord, objectType })?.objectType).toBe(
      objectType,
    );
  });
});

describe("building designs from search records", () => {
  it("keeps one design when the same system number arrives twice", () => {
    const designs = buildDesigns([
      completeRecord,
      { ...completeRecord, _primaryTitle: "Wallpaper, second copy" },
    ]);

    expect(designs).toHaveLength(1);
    expect(designs[0]?.id).toBe("O176602");
    expect(designs[0]?.title).toBe("Wallpaper");
  });
});
