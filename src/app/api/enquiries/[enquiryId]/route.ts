import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  try {
    const { enquiryId } = await params;

    if (!enquiryId) {
      return new NextResponse("Enquiry id is required", { status: 400 });
    }

    const enquiry = await prismadb.distributorEnquiry.findUnique({
      where: {
        id: enquiryId
      }
    });
  
    return NextResponse.json(enquiry);
  } catch (error) {
    console.log('[ENQUIRY_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  try {
    const { enquiryId } = await params;

    if (!enquiryId) {
      return new NextResponse("Enquiry id is required", { status: 400 });
    }

    const enquiry = await prismadb.distributorEnquiry.delete({
      where: {
        id: enquiryId
      }
    });
  
    return NextResponse.json(enquiry);
  } catch (error) {
    console.log('[ENQUIRY_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  try {
    const { enquiryId } = await params;
    const body = await req.json();

    const { status } = body;

    if (!enquiryId) {
      return new NextResponse("Enquiry id is required", { status: 400 });
    }

    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }

    const enquiry = await prismadb.distributorEnquiry.update({
      where: {
        id: enquiryId
      },
      data: {
        status
      }
    });
  
    return NextResponse.json(enquiry);
  } catch (error) {
    console.log('[ENQUIRY_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
