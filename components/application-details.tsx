"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplicationType } from "./application-card";
import { useState } from "react";

interface ApplicationDetailsProps {
  application: ApplicationType;
  applications: ApplicationType[];
  onApplicationChange: (appId: string) => void;
}

const certificateData = {
  "general-building": {
    categories: ["A", "B", "C"],
    defaultFee: "GHS 1000",
    defaultRenewal: "GHS 500",
  },
  "electrical": {
    categories: ["D", "E", "F"],
    defaultFee: "GHS 1500",
    defaultRenewal: "GHS 800",
  },
  "plumbing": {
    categories: ["G", "H", "I"],
    defaultFee: "GHS 1200",
    defaultRenewal: "GHS 600",
  },
};

export function ApplicationDetails({
  application,
  applications,
  onApplicationChange,
}: ApplicationDetailsProps) {
  const [selectedClass, setSelectedClass] = useState("2");
  const [selectedCategory, setSelectedCategory] = useState(
    certificateData[application.id as keyof typeof certificateData]?.categories[0] || "A"
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  const certData = certificateData[application.id as keyof typeof certificateData] || certificateData["general-building"];

  const getShapeLarge = (shape: string) => {
    return shape.replace(".svg", "-large.svg");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Certification Type and Category Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Certification Type :</Label>
          <Select
            value={application.id}
            onValueChange={onApplicationChange}
          >
            <SelectTrigger className="w-[200px] border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Category :</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[80px] border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {certData.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Large Shape Card */}
      <motion.div
        layout
        className="relative"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative h-[169px] w-full max-w-[720px]">
          <Image
            src={getShapeLarge(application.shape)}
            alt={application.name}
            fill
            className="object-contain object-left"
          />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="relative top-0 lg:-top-10 md:top-0 left-0 lg:left-2 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <h3 className="text-xl font-semibold text-white">
                {application.name}
              </h3>
            </div>
            <div className="relative top-0 lg:-top-14  md:top-0 left-0 lg:-left-4 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <Image src="/circle-check.png" alt="Approved" width={24} height={24} className="h-8 w-8" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Class Type Dropdown */}
      <div className="relative">
        <div className="flex items-center justify-between gap-4 rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
          <Label className="text-base font-medium">
            Select Class Type
          </Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-auto border-0 bg-transparent p-0 [&>svg]:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Class 1</SelectItem>
              <SelectItem value="2">Class 2</SelectItem>
              <SelectItem value="3">Class 3</SelectItem>
            </SelectContent>
          </Select>
          <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-md border-4 border-black bg-white dark:bg-gray-800">
            <ChevronDown className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Certificate Information */}
      <div className="rounded-lg border bg-white p-6 dark:bg-gray-950">
        <h3 className="mb-4 text-xl font-bold">Certificate Information:</h3>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-medium">Financial Class:</span> Up to USD $50,000
          </p>
          <p>
            <span className="font-medium">Class:</span> {selectedClass}
          </p>
          <p>
            <span className="font-medium">Category:</span> {selectedCategory}
          </p>
          <p>
            <span className="font-medium">Certification fee:</span> {certData.defaultFee}
          </p>
          <p>
            <span className="font-medium">Annual Renewal fees:</span> {certData.defaultRenewal}
          </p>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="confirm"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
        <Label
          htmlFor="confirm"
          className="cursor-pointer text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I confirm the Selected Certificate Type and Class is accurate
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!isConfirmed}
          className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Submit
        </Button>
      </div>
    </motion.div>
  );
}

