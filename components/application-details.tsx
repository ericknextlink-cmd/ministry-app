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
  onSubmitApplication: () => void;
}

const certificateData = {
  "general-building": {
    category: "DK",
    classes: [
      {
        id: "D1K1",
        label: "D1K1",
        registration: "¢3500",
        renewal: "¢2010",
        financialClass: "Over $500,000",
        requiresLLC: true,
      },
      {
        id: "D2K2",
        label: "D2K2",
        registration: "¢2500",
        renewal: "¢410",
        financialClass: "$200,000 - $500,000",
        requiresLLC: true,
      },
      {
        id: "D3K3",
        label: "D3K3",
        registration: "¢600",
        renewal: "¢210",
        financialClass: "$75,000 - $200,000",
        requiresLLC: false,
      },
    ],
  },
  "electrical": {
    category: "E",
    classes: [
      {
        id: "E1",
        label: "E1",
        registration: "¢1500",
        renewal: "¢410",
        financialClass: "Over $200,000",
        requiresLLC: false,
      },
      {
        id: "E2",
        label: "E2",
        registration: "¢1000",
        renewal: "¢210",
        financialClass: "$75,000 - $200,000",
        requiresLLC: false,
      },
    ],
  },
  "plumbing": {
    category: "G",
    classes: [
      {
        id: "G1",
        label: "G1",
        registration: "¢1000",
        renewal: "¢210",
        financialClass: "Over $200,000",
        requiresLLC: false,
      },
      {
        id: "G2",
        label: "G2",
        registration: "¢400",
        renewal: "¢50",
        financialClass: "Up to $50,000",
        requiresLLC: false,
      },
    ],
  },
};

export function ApplicationDetails({
  application,
  applications,
  onApplicationChange,
  onSubmitApplication,
}: ApplicationDetailsProps) {
  const certData = certificateData[application.id as keyof typeof certificateData] || certificateData["general-building"];
  
  const [selectedClass, setSelectedClass] = useState(certData.classes[0].id);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const handleSubmit = () => {
    if (isConfirmed) {
      onSubmitApplication();
    }
  };

  const selectedClassData = certData.classes.find(c => c.id === selectedClass) || certData.classes[0];

  const getShapeLarge = (shape: string) => {
    return shape.replace(".svg", "-large.svg");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Certification Type and Category Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Certification Type Bar */}
        <div className="flex items-center rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
          <Select
            value={application.id}
            onValueChange={(value) => {
              onApplicationChange(value);
              const newCertData = certificateData[value as keyof typeof certificateData];
              if (newCertData) {
                setSelectedClass(newCertData.classes[0].id);
              }
            }}
          >
            <SelectTrigger className="w-full border-0 bg-transparent p-0 [&>svg]:hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Certification Type:</span>
                <SelectValue />
              </div>
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

        {/* Category Bar */}
        <div className="flex items-center rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
          <span className="text-sm font-medium">Category:</span>
          <span className="ml-2 text-sm font-bold text-gray-900 dark:text-gray-100">
            {certData.category}
          </span>
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
      <div className="flex items-center justify-between rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
        <span className="text-base font-medium">Select Class Type</span>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-auto border-0 bg-transparent p-0 [&>svg]:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {certData.classes.map((classItem) => (
              <SelectItem key={classItem.id} value={classItem.id}>
                {classItem.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-white dark:bg-gray-800">
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>

      {/* Certificate Information */}
      <div className="rounded-lg border bg-white p-6 dark:bg-gray-950">
        <h3 className="mb-4 text-xl font-bold">Certificate Information:</h3>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-medium">Financial Class:</span> {selectedClassData.financialClass}
          </p>
          <p>
            <span className="font-medium">Class:</span> {selectedClassData.label}
          </p>
          <p>
            <span className="font-medium">Category:</span> {certData.category}
          </p>
          <p>
            <span className="font-medium">New registration:</span> {selectedClassData.registration}
          </p>
          <p>
            <span className="font-medium">Renewal:</span> {selectedClassData.renewal}
          </p>
          {selectedClassData.requiresLLC && (
            <p className="pt-2 italic text-blue-600 dark:text-blue-400">
              * Limited Liability Company registration required
            </p>
          )}
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
          onClick={handleSubmit}
          className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Submit
        </Button>
      </div>
    </motion.div>
  );
}

